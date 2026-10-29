package edu.anu.ppm.auth;

import static edu.anu.ppm.auth.AuthModels.*;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.SecureRandom;
import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.Base64;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Set;
import java.util.UUID;

import tools.jackson.core.JacksonException;
import tools.jackson.core.type.TypeReference;
import tools.jackson.databind.ObjectMapper;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.dao.DuplicateKeyException;
import org.springframework.http.HttpStatus;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
class AuthService {
    private static final Set<String> ALLOWED_ROLES = Set.of("Portfolio Manager", "Project Proposer", "Reviewer");
    private static final SecureRandom RANDOM = new SecureRandom();

    private final JdbcTemplate jdbc;
    private final PasswordEncoder passwordEncoder;
    private final ObjectMapper objectMapper;
    private final long sessionHours;

    AuthService(JdbcTemplate jdbc, PasswordEncoder passwordEncoder, ObjectMapper objectMapper,
                @Value("${ppm.session-hours:168}") long sessionHours) {
        this.jdbc = jdbc;
        this.passwordEncoder = passwordEncoder;
        this.objectMapper = objectMapper;
        this.sessionHours = Math.max(1, Math.min(sessionHours, 24 * 30));
    }

    private static final Set<String> WORKSPACE_KEYS = Set.of(
            "ppm-organisation", "ppm-v2-custom-proposals", "ppm-v2-evaluation-comments",
            "ppm-v2-shortlist", "ppm-v2-scenarios", "ppm-v2-decisions",
            "ppm-v2-scenario-decisions", "ppm-v2-removed-proposals");
    private static final Set<String> PORTFOLIO_MANAGER_KEYS = Set.of(
            "ppm-v2-shortlist", "ppm-v2-scenarios", "ppm-v2-decisions",
            "ppm-v2-scenario-decisions", "ppm-v2-removed-proposals");
    private static final Set<String> PROPOSAL_FIELDS = Set.of(
            "title", "owner", "category", "objective", "duration", "cost", "staff",
            "summary", "benefits", "risks", "scenarioGroup");
    private static final int MAX_WORKSPACE_CHARACTERS = 2_000_000;
    private record LegacyWorkspace(UUID userId, String role, String json) {}

    @Transactional
    AuthResponse register(RegisterRequest request) {
        String name = cleanName(request == null ? null : request.name());
        String email = cleanEmail(request == null ? null : request.email());
        String password = cleanPassword(request == null ? null : request.password());
        String role = cleanRole(request == null ? null : request.role());
        if (userByEmail(email) != null) {
            throw new AuthException(HttpStatus.CONFLICT, "An account with this email already exists.");
        }

        Instant createdAt = Instant.now();
        StoredUser user = new StoredUser(UUID.randomUUID(), name, email, passwordEncoder.encode(password), role, createdAt);
        try {
            jdbc.update("INSERT INTO ppm_users (id, display_name, email, password_hash, workspace_role, created_at) VALUES (?, ?, ?, ?, ?, ?)",
                    user.id(), user.name(), user.email(), user.passwordHash(), user.role(), java.sql.Timestamp.from(createdAt));
        } catch (DuplicateKeyException exception) {
            throw new AuthException(HttpStatus.CONFLICT, "An account with this email already exists.");
        }
        return issueSession(user);
    }

    @Transactional
    AuthResponse login(LoginRequest request) {
        String email = cleanEmail(request == null ? null : request.email());
        String password = request == null || request.password() == null ? "" : request.password();
        StoredUser user = userByEmail(email);
        if (user == null || password.isBlank() || !passwordEncoder.matches(password, user.passwordHash())) {
            throw new AuthException(HttpStatus.UNAUTHORIZED, "Email or password is incorrect.");
        }
        jdbc.update("DELETE FROM ppm_login_sessions WHERE expires_at <= ?", java.sql.Timestamp.from(Instant.now()));
        return issueSession(user);
    }

    UserResponse currentUser(String bearerToken) {
        return userForSession(bearerToken).toResponse();
    }

    WorkspaceResponse readWorkspace(String bearerToken) {
        StoredUser user = userForSession(bearerToken);
        List<StoredWorkspace> rows = jdbc.query(
                "SELECT workspace_json, version FROM ppm_shared_workspace_data WHERE workspace_id = 'everyone'",
                (result, row) -> new StoredWorkspace(result.getString("workspace_json"), result.getLong("version")));
        if (rows.isEmpty()) {
            Map<String, String> migrated = importLegacyWorkspaces();
            if (!migrated.isEmpty()) {
                checkWorkspaceSize(writeWorkspaceJson(migrated));
                try {
                    jdbc.update("INSERT INTO ppm_shared_workspace_data (workspace_id, workspace_json, version, updated_at) VALUES ('everyone', ?, 1, ?)",
                            writeWorkspaceJson(migrated), java.sql.Timestamp.from(Instant.now()));
                } catch (DuplicateKeyException ignored) {
                    // A concurrent first-time request created the same migrated workspace.
                    return new WorkspaceResponse("shared:everyone", filterWorkspace(migrated, user), 1);
                }
                rows = jdbc.query(
                        "SELECT workspace_json, version FROM ppm_shared_workspace_data WHERE workspace_id = 'everyone'",
                        (result, row) -> new StoredWorkspace(result.getString("workspace_json"), result.getLong("version")));
                if (rows.isEmpty()) return new WorkspaceResponse("shared:everyone", filterWorkspace(migrated, user), 1);
            } else {
                return new WorkspaceResponse("shared:everyone", filterWorkspace(Map.of(), user), 0);
            }
        }
        try {
            Map<String, String> data = objectMapper.readValue(rows.get(0).json(), new TypeReference<>() {});
            return new WorkspaceResponse("shared:everyone", filterWorkspace(data, user), rows.get(0).version());
        } catch (JacksonException exception) {
            throw new IllegalStateException("Saved workspace data could not be read.", exception);
        }
    }

    @Transactional
    WorkspaceResponse saveWorkspace(String bearerToken, WorkspaceRequest request) {
        StoredUser user = userForSession(bearerToken);
        Map<String, String> incoming = validateWorkspace(request);

        Long expectedVersion = request.expectedVersion() == null ? 0L : request.expectedVersion();
        if (request.scopeId() != null && !request.scopeId().equals("shared:everyone")) {
            throw new AuthException(HttpStatus.CONFLICT, "The workspace scope changed. Reload the workplace before saving.");
        }
        List<StoredWorkspace> rows = jdbc.query(
                "SELECT workspace_json, version FROM ppm_shared_workspace_data WHERE workspace_id = 'everyone' FOR UPDATE",
                (result, row) -> new StoredWorkspace(result.getString("workspace_json"), result.getLong("version")));
        Instant now = Instant.now();
        if (rows.isEmpty()) {
            if (expectedVersion != 0) throw workspaceConflict();
            Map<String, String> current = importLegacyWorkspaces();
            Map<String, String> data = mergeWorkspace(current, incoming, user);
            String json = writeWorkspaceJson(data);
            checkWorkspaceSize(json);
            try {
                jdbc.update("INSERT INTO ppm_shared_workspace_data (workspace_id, workspace_json, version, updated_at) VALUES ('everyone', ?, 1, ?)",
                        json, java.sql.Timestamp.from(now));
            } catch (DuplicateKeyException exception) {
                throw workspaceConflict();
            }
            return new WorkspaceResponse("shared:everyone", filterWorkspace(data, user), 1);
        }

        long currentVersion = rows.get(0).version();
        if (expectedVersion != currentVersion) throw workspaceConflict();
        Map<String, String> current;
        try {
            current = objectMapper.readValue(rows.get(0).json(), new TypeReference<>() {});
        } catch (JacksonException exception) {
            throw new IllegalStateException("Saved workspace data could not be read.", exception);
        }
        Map<String, String> data = mergeWorkspace(current, incoming, user);
        String json = writeWorkspaceJson(data);
        checkWorkspaceSize(json);
        int updated = jdbc.update(
                "UPDATE ppm_shared_workspace_data SET workspace_json = ?, version = version + 1, updated_at = ? WHERE workspace_id = 'everyone' AND version = ?",
                json, java.sql.Timestamp.from(now), expectedVersion);
        if (updated != 1) throw workspaceConflict();
        return new WorkspaceResponse("shared:everyone", filterWorkspace(data, user), currentVersion + 1);
    }

    private String writeWorkspaceJson(Map<String, String> data) {
        try {
            return objectMapper.writeValueAsString(data);
        } catch (JacksonException exception) {
            throw new AuthException(HttpStatus.BAD_REQUEST, "Workspace data could not be saved.");
        }
    }

    private void checkWorkspaceSize(String json) {
        if (json.length() > MAX_WORKSPACE_CHARACTERS) {
            throw new AuthException(HttpStatus.PAYLOAD_TOO_LARGE, "Workspace data is too large to sync.");
        }
    }

    private Map<String, String> importLegacyWorkspaces() {
        List<LegacyWorkspace> legacy = jdbc.query(
                "SELECT d.user_id, u.workspace_role, d.workspace_json FROM ppm_workspace_data d " +
                        "JOIN ppm_users u ON u.id = d.user_id ORDER BY d.updated_at ASC",
                (result, row) -> new LegacyWorkspace(result.getObject("user_id", UUID.class),
                        result.getString("workspace_role"), result.getString("workspace_json")));
        Map<String, String> merged = new LinkedHashMap<>();
        Map<String, Map<String, Object>> proposals = new LinkedHashMap<>();
        for (LegacyWorkspace source : legacy) {
            Map<String, String> data = parseWorkspaceJson(source.json());
            for (Map.Entry<String, String> entry : data.entrySet()) {
                String key = entry.getKey();
                if (key.startsWith("ppm-evaluation-") || key.startsWith("ppm-note-")) merged.put(key, entry.getValue());
            }
            if ("Portfolio Manager".equals(source.role())) {
                if (data.containsKey("ppm-organisation")) merged.put("ppm-organisation", data.get("ppm-organisation"));
                PORTFOLIO_MANAGER_KEYS.forEach(key -> { if (data.containsKey(key)) merged.put(key, data.get(key)); });
            }
            mergeLegacyComments(merged, data.get("ppm-v2-evaluation-comments"));
            for (Map<String, Object> proposal : parseProposalList(data.get("ppm-v2-custom-proposals"))) {
                String id = stringValue(proposal.get("id"));
                if (id.isBlank()) continue;
                proposal.putIfAbsent("createdBy", source.userId().toString());
                proposal.put("isCustom", true);
                proposals.put(id, proposal);
            }
        }
        merged.put("ppm-v2-custom-proposals", writeJson(new ArrayList<>(proposals.values())));
        if (!merged.containsKey("ppm-v2-evaluation-comments")) merged.put("ppm-v2-evaluation-comments", "{}");
        return merged;
    }

    private Map<String, String> parseWorkspaceJson(String json) {
        try {
            Map<String, String> parsed = objectMapper.readValue(json, new TypeReference<>() {});
            return parsed == null ? Map.of() : parsed;
        } catch (JacksonException exception) {
            throw new IllegalStateException("Saved workspace data could not be read.", exception);
        }
    }

    private List<Map<String, Object>> parseProposalList(String json) {
        if (json == null || json.isBlank()) return new ArrayList<>();
        try {
            List<Map<String, Object>> parsed = objectMapper.readValue(json, new TypeReference<>() {});
            return parsed == null ? new ArrayList<>() : new ArrayList<>(parsed);
        } catch (JacksonException exception) {
            throw new AuthException(HttpStatus.BAD_REQUEST, "Project proposals could not be read.");
        }
    }

    private Map<String, Object> parseObject(String json) {
        if (json == null || json.isBlank()) return new LinkedHashMap<>();
        try {
            Map<String, Object> parsed = objectMapper.readValue(json, new TypeReference<>() {});
            return parsed == null ? new LinkedHashMap<>() : new LinkedHashMap<>(parsed);
        } catch (JacksonException exception) {
            throw new AuthException(HttpStatus.BAD_REQUEST, "Workspace item could not be read.");
        }
    }

    private String writeJson(Object value) {
        try {
            return objectMapper.writeValueAsString(value);
        } catch (JacksonException exception) {
            throw new AuthException(HttpStatus.BAD_REQUEST, "Workspace item could not be saved.");
        }
    }

    private void mergeLegacyComments(Map<String, String> target, String incomingJson) {
        if (incomingJson == null) return;
        target.put("ppm-v2-evaluation-comments", mergeComments(target.get("ppm-v2-evaluation-comments"), incomingJson));
    }

    private Map<String, String> filterWorkspace(Map<String, String> all, StoredUser user) {
        Map<String, String> visible = new LinkedHashMap<>();
        String role = user.role();
        if ("Portfolio Manager".equals(role)) {
            visible.putAll(all);
            visible.putIfAbsent("ppm-v2-custom-proposals", "[]");
            return visible;
        }

        if ("Project Proposer".equals(role) && all.containsKey("ppm-organisation")) {
            visible.put("ppm-organisation", all.get("ppm-organisation"));
        }
        List<Map<String, Object>> relevantProposals = parseProposalList(all.get("ppm-v2-custom-proposals")).stream()
                .filter(proposal -> "Reviewer".equals(role) || user.id().toString().equals(stringValue(proposal.get("createdBy"))))
                .toList();
        List<Map<String, Object>> owned = relevantProposals.stream()
                .filter(proposal -> user.id().toString().equals(stringValue(proposal.get("createdBy"))))
                .toList();
        Set<String> ownedIds = owned.stream().map(proposal -> stringValue(proposal.get("id")))
                .filter(id -> !id.isBlank()).collect(java.util.stream.Collectors.toSet());
        visible.put("ppm-v2-custom-proposals", writeJson(relevantProposals));

        for (Map.Entry<String, String> entry : all.entrySet()) {
            String key = entry.getKey();
            if (key.startsWith("ppm-evaluation-") || key.startsWith("ppm-note-")) {
                String id = key.startsWith("ppm-evaluation-") ? key.substring("ppm-evaluation-".length()) : key.substring("ppm-note-".length());
                if (("Reviewer".equals(role) || "Portfolio Manager".equals(role)) || ownedIds.contains(id)) {
                    visible.put(key, entry.getValue());
                }
            }
        }
        if ("Reviewer".equals(role)) {
            if (all.containsKey("ppm-v2-evaluation-comments")) visible.put("ppm-v2-evaluation-comments", all.get("ppm-v2-evaluation-comments"));
            if (all.containsKey("ppm-v2-removed-proposals")) visible.put("ppm-v2-removed-proposals", all.get("ppm-v2-removed-proposals"));
        } else if ("Project Proposer".equals(role)) {
            Map<String, Object> comments = parseObject(all.get("ppm-v2-evaluation-comments"));
            Map<String, Object> ownComments = new LinkedHashMap<>();
            ownedIds.forEach(id -> { if (comments.containsKey(id)) ownComments.put(id, comments.get(id)); });
            visible.put("ppm-v2-evaluation-comments", writeJson(ownComments));
        }
        return visible;
    }

    private Map<String, String> mergeWorkspace(Map<String, String> current, Map<String, String> incoming, StoredUser user) {
        Map<String, String> merged = new LinkedHashMap<>(current);
        switch (user.role()) {
            case "Project Proposer" -> {
                if (incoming.containsKey("ppm-v2-custom-proposals")) {
                    mergeProposerProjects(merged, incoming.get("ppm-v2-custom-proposals"), user.id());
                }
            }
            case "Reviewer" -> {
                incoming.forEach((key, value) -> {
                    if ((key.startsWith("ppm-evaluation-") || key.startsWith("ppm-note-")) && proposalExists(merged, key)) {
                        merged.put(key, value);
                    } else if ("ppm-v2-evaluation-comments".equals(key)) {
                        merged.put(key, mergeComments(merged.get(key), value));
                    }
                });
            }
            case "Portfolio Manager" -> {
                if (incoming.containsKey("ppm-organisation")) merged.put("ppm-organisation", incoming.get("ppm-organisation"));
                PORTFOLIO_MANAGER_KEYS.forEach(key -> {
                    if (incoming.containsKey(key)) merged.put(key, incoming.get(key));
                });
                if (incoming.containsKey("ppm-v2-custom-proposals")) {
                    removeManagerDeletedProjects(merged, incoming.get("ppm-v2-custom-proposals"));
                }
            }
            default -> throw new AuthException(HttpStatus.FORBIDDEN, "Choose a valid workspace role before syncing.");
        }
        return merged;
    }

    private void mergeProposerProjects(Map<String, String> workspace, String incomingJson, UUID userId) {
        List<Map<String, Object>> existing = parseProposalList(workspace.get("ppm-v2-custom-proposals"));
        Map<String, Map<String, Object>> byId = new LinkedHashMap<>();
        existing.forEach(proposal -> {
            String id = stringValue(proposal.get("id"));
            if (!id.isBlank()) byId.put(id, proposal);
        });
        List<Map<String, Object>> submitted = parseProposalList(incomingJson);
        Set<String> submittedIds = submitted.stream().map(proposal -> stringValue(proposal.get("id")))
                .filter(id -> !id.isBlank()).collect(java.util.stream.Collectors.toSet());
        List<String> deleted = byId.values().stream()
                .filter(proposal -> userId.toString().equals(stringValue(proposal.get("createdBy"))))
                .map(proposal -> stringValue(proposal.get("id"))).filter(id -> !submittedIds.contains(id)).toList();
        deleted.forEach(id -> {
            byId.remove(id);
            removeProjectData(workspace, id);
        });

        for (Map<String, Object> submittedProposal : submitted) {
            String id = stringValue(submittedProposal.get("id"));
            if (id.isBlank() || id.length() > 120) continue;
            Map<String, Object> existingProposal = byId.get(id);
            if (existingProposal == null) {
                Map<String, Object> created = new LinkedHashMap<>(submittedProposal);
                created.put("id", id);
                created.put("createdBy", userId.toString());
                created.put("isCustom", true);
                created.put("scores", Map.of());
                created.put("rationales", Map.of());
                created.put("missing", List.of());
                created.put("status", "Submitted");
                created.put("reviewedBy", "");
                byId.put(id, created);
            } else if (userId.toString().equals(stringValue(existingProposal.get("createdBy")))) {
                Map<String, Object> updated = new LinkedHashMap<>(existingProposal);
                PROPOSAL_FIELDS.forEach(field -> { if (submittedProposal.containsKey(field)) updated.put(field, submittedProposal.get(field)); });
                updated.put("createdBy", userId.toString());
                byId.put(id, updated);
            }
        }
        workspace.put("ppm-v2-custom-proposals", writeJson(new ArrayList<>(byId.values())));
    }

    private void removeManagerDeletedProjects(Map<String, String> workspace, String incomingJson) {
        Set<String> submittedIds = parseProposalList(incomingJson).stream().map(proposal -> stringValue(proposal.get("id")))
                .filter(id -> !id.isBlank()).collect(java.util.stream.Collectors.toSet());
        List<String> deleted = parseProposalList(workspace.get("ppm-v2-custom-proposals")).stream()
                .map(proposal -> stringValue(proposal.get("id"))).filter(id -> !id.isBlank() && !submittedIds.contains(id)).toList();
        deleted.forEach(id -> removeProjectData(workspace, id));
        List<Map<String, Object>> retained = parseProposalList(workspace.get("ppm-v2-custom-proposals")).stream()
                .filter(proposal -> submittedIds.contains(stringValue(proposal.get("id")))).toList();
        workspace.put("ppm-v2-custom-proposals", writeJson(retained));
    }

    private boolean proposalExists(Map<String, String> workspace, String evaluationKey) {
        String id = evaluationKey.startsWith("ppm-evaluation-")
                ? evaluationKey.substring("ppm-evaluation-".length())
                : evaluationKey.substring("ppm-note-".length());
        if (id.isBlank()) return false;
        return parseProposalList(workspace.get("ppm-v2-custom-proposals")).stream()
                .anyMatch(proposal -> id.equals(stringValue(proposal.get("id")))) || id.matches("[a-zA-Z0-9_-]{1,120}");
    }

    private void removeProjectData(Map<String, String> workspace, String id) {
        workspace.remove("ppm-evaluation-" + id);
        workspace.remove("ppm-note-" + id);
        Map<String, Object> comments = parseObject(workspace.get("ppm-v2-evaluation-comments"));
        comments.remove(id);
        workspace.put("ppm-v2-evaluation-comments", writeJson(comments));
        removeStringFromList(workspace, "ppm-v2-shortlist", id);
        Map<String, Object> decisions = parseObject(workspace.get("ppm-v2-decisions"));
        decisions.remove(id);
        workspace.put("ppm-v2-decisions", writeJson(decisions));
        for (String key : List.of("ppm-v2-scenarios", "ppm-v2-scenario-decisions")) {
            Map<String, Object> records = parseObject(workspace.get(key));
            records.values().forEach(value -> removeProjectId(value, id));
            workspace.put(key, writeJson(records));
        }
    }

    private void removeStringFromList(Map<String, String> workspace, String key, String id) {
        String json = workspace.get(key);
        if (json == null) return;
        try {
            List<Object> values = objectMapper.readValue(json, new TypeReference<>() {});
            values.removeIf(value -> id.equals(stringValue(value)));
            workspace.put(key, writeJson(values));
        } catch (JacksonException exception) {
            throw new IllegalStateException("Saved portfolio data could not be read.", exception);
        }
    }

    @SuppressWarnings("unchecked")
    private void removeProjectId(Object value, String id) {
        if (value instanceof List<?> list) {
            ((List<Object>) list).removeIf(item -> id.equals(stringValue(item)));
            list.forEach(item -> removeProjectId(item, id));
        } else if (value instanceof Map<?, ?> map) {
            map.values().forEach(item -> removeProjectId(item, id));
        }
    }

    private String mergeComments(String currentJson, String incomingJson) {
        Map<String, Object> current = parseObject(currentJson);
        Map<String, Object> incoming = parseObject(incomingJson);
        incoming.forEach((projectId, value) -> {
            List<Object> all = current.get(projectId) instanceof List<?> list ? new ArrayList<>(list) : new ArrayList<>();
            if (value instanceof List<?> newComments) {
                for (Object comment : newComments) {
                    if (!all.contains(comment)) all.add(comment);
                }
            }
            current.put(projectId, all);
        });
        return writeJson(current);
    }

    private String stringValue(Object value) {
        return value == null ? "" : String.valueOf(value);
    }

    private Map<String, String> validateWorkspace(WorkspaceRequest request) {
        if (request == null || request.data() == null || request.expectedVersion() != null && request.expectedVersion() < 0) {
            throw new AuthException(HttpStatus.BAD_REQUEST, "Workspace data is incomplete.");
        }
        if (request.data().size() > 500) throw new AuthException(HttpStatus.BAD_REQUEST, "Workspace has too many saved items.");
        for (Map.Entry<String, String> entry : request.data().entrySet()) {
            String key = entry.getKey();
            String value = entry.getValue();
            boolean allowed = key != null && (WORKSPACE_KEYS.contains(key) || key.startsWith("ppm-evaluation-") || key.startsWith("ppm-note-"));
            if (!allowed || value == null || value.length() > MAX_WORKSPACE_CHARACTERS) {
                throw new AuthException(HttpStatus.BAD_REQUEST, "Workspace contains an unsupported or invalid item.");
            }
        }
        return Map.copyOf(request.data());
    }

    private AuthException workspaceConflict() {
        return new AuthException(HttpStatus.CONFLICT, "This shared workspace changed on another account or device. Reload before saving again.");
    }

    @Transactional
    UserResponse updateProfile(String bearerToken, ProfileUpdateRequest request) {
        StoredUser current = userForSession(bearerToken);
        String name = cleanName(request == null ? null : request.name());
        String email = cleanEmail(request == null ? null : request.email());
        String role = cleanRole(request == null ? null : request.role());
        StoredUser existing = userByEmail(email);
        if (existing != null && !existing.id().equals(current.id())) {
            throw new AuthException(HttpStatus.CONFLICT, "An account with this email already exists.");
        }
        try {
            jdbc.update("UPDATE ppm_users SET display_name = ?, email = ?, workspace_role = ? WHERE id = ?",
                    name, email, role, current.id());
        } catch (DuplicateKeyException exception) {
            throw new AuthException(HttpStatus.CONFLICT, "An account with this email already exists.");
        }
        return new StoredUser(current.id(), name, email, current.passwordHash(), role, current.createdAt()).toResponse();
    }

    private StoredUser userForSession(String bearerToken) {
        String hash = tokenHash(requireToken(bearerToken));
        List<StoredUser> users = jdbc.query(
                "SELECT u.id, u.display_name, u.email, u.password_hash, u.workspace_role, u.created_at " +
                        "FROM ppm_login_sessions s JOIN ppm_users u ON u.id = s.user_id WHERE s.token_hash = ? AND s.expires_at > ?",
                (result, row) -> new StoredUser(result.getObject("id", UUID.class), result.getString("display_name"),
                        result.getString("email"), result.getString("password_hash"), result.getString("workspace_role"),
                        result.getTimestamp("created_at").toInstant()),
                hash, java.sql.Timestamp.from(Instant.now()));
        if (users.isEmpty()) throw new AuthException(HttpStatus.UNAUTHORIZED, "Your session has expired. Please sign in again.");
        return users.get(0);
    }

    void logout(String bearerToken) {
        jdbc.update("DELETE FROM ppm_login_sessions WHERE token_hash = ?", tokenHash(requireToken(bearerToken)));
    }

    @Transactional
    void deleteAccount(String bearerToken) {
        StoredUser user = userForSession(bearerToken);
        jdbc.update("DELETE FROM ppm_users WHERE id = ?", user.id());
    }

    private AuthResponse issueSession(StoredUser user) {
        byte[] bytes = new byte[32];
        RANDOM.nextBytes(bytes);
        String token = Base64.getUrlEncoder().withoutPadding().encodeToString(bytes);
        Instant now = Instant.now();
        jdbc.update("INSERT INTO ppm_login_sessions (token_hash, user_id, expires_at, created_at) VALUES (?, ?, ?, ?)",
                tokenHash(token), user.id(), java.sql.Timestamp.from(now.plus(sessionHours, ChronoUnit.HOURS)), java.sql.Timestamp.from(now));
        return new AuthResponse(token, user.toResponse());
    }

    private StoredUser userByEmail(String email) {
        List<StoredUser> users = jdbc.query(
                "SELECT id, display_name, email, password_hash, workspace_role, created_at FROM ppm_users WHERE email = ?",
                (result, row) -> new StoredUser(result.getObject("id", UUID.class), result.getString("display_name"),
                        result.getString("email"), result.getString("password_hash"), result.getString("workspace_role"),
                        result.getTimestamp("created_at").toInstant()), email);
        return users.isEmpty() ? null : users.get(0);
    }

    private String requireToken(String token) {
        if (token == null || token.isBlank() || token.length() > 100) {
            throw new AuthException(HttpStatus.UNAUTHORIZED, "Please sign in to continue.");
        }
        return token;
    }

    private static String cleanName(String value) {
        String name = value == null ? "" : value.trim();
        if (name.length() < 2 || name.length() > 80) throw new AuthException(HttpStatus.BAD_REQUEST, "Enter a name between 2 and 80 characters.");
        return name;
    }

    private static String cleanEmail(String value) {
        String email = value == null ? "" : value.trim().toLowerCase(Locale.ROOT);
        if (email.length() > 254 || !email.matches("^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$")) {
            throw new AuthException(HttpStatus.BAD_REQUEST, "Enter a valid email address.");
        }
        return email;
    }

    private static String cleanPassword(String value) {
        String password = value == null ? "" : value;
        int bytes = password.getBytes(StandardCharsets.UTF_8).length;
        if (bytes < 8 || bytes > 72) throw new AuthException(HttpStatus.BAD_REQUEST, "Use a password between 8 and 72 bytes.");
        return password;
    }

    private static String cleanRole(String value) {
        String role = value == null ? "" : value.trim();
        if (!ALLOWED_ROLES.contains(role)) throw new AuthException(HttpStatus.BAD_REQUEST, "Choose a valid workspace role.");
        return role;
    }

    private static String tokenHash(String token) {
        try {
            byte[] digest = MessageDigest.getInstance("SHA-256").digest(token.getBytes(StandardCharsets.UTF_8));
            return java.util.HexFormat.of().formatHex(digest);
        } catch (Exception exception) {
            throw new IllegalStateException("SHA-256 is unavailable", exception);
        }
    }
}
