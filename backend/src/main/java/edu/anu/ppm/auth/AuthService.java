package edu.anu.ppm.auth;

import static edu.anu.ppm.auth.AuthModels.*;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.SecureRandom;
import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.Base64;
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
    private static final int MAX_WORKSPACE_CHARACTERS = 2_000_000;

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
                "SELECT workspace_json, version FROM ppm_workspace_data WHERE user_id = ?",
                (result, row) -> new StoredWorkspace(result.getString("workspace_json"), result.getLong("version")),
                user.id());
        if (rows.isEmpty()) return new WorkspaceResponse(Map.of(), 0);
        try {
            Map<String, String> data = objectMapper.readValue(rows.get(0).json(), new TypeReference<>() {});
            return new WorkspaceResponse(data, rows.get(0).version());
        } catch (JacksonException exception) {
            throw new IllegalStateException("Saved workspace data could not be read.", exception);
        }
    }

    @Transactional
    WorkspaceResponse saveWorkspace(String bearerToken, WorkspaceRequest request) {
        StoredUser user = userForSession(bearerToken);
        Map<String, String> data = validateWorkspace(request);
        String json;
        try {
            json = objectMapper.writeValueAsString(data);
        } catch (JacksonException exception) {
            throw new AuthException(HttpStatus.BAD_REQUEST, "Workspace data could not be saved.");
        }
        if (json.length() > MAX_WORKSPACE_CHARACTERS) {
            throw new AuthException(HttpStatus.PAYLOAD_TOO_LARGE, "Workspace data is too large to sync.");
        }

        Long expectedVersion = request.expectedVersion() == null ? 0L : request.expectedVersion();
        List<Long> versions = jdbc.query("SELECT version FROM ppm_workspace_data WHERE user_id = ?",
                (result, row) -> result.getLong("version"), user.id());
        Instant now = Instant.now();
        if (versions.isEmpty()) {
            if (expectedVersion != 0) throw workspaceConflict();
            try {
                jdbc.update("INSERT INTO ppm_workspace_data (user_id, workspace_json, version, updated_at) VALUES (?, ?, 1, ?)",
                        user.id(), json, java.sql.Timestamp.from(now));
            } catch (DuplicateKeyException exception) {
                throw workspaceConflict();
            }
            return new WorkspaceResponse(data, 1);
        }

        long currentVersion = versions.get(0);
        if (expectedVersion != currentVersion) throw workspaceConflict();
        int updated = jdbc.update(
                "UPDATE ppm_workspace_data SET workspace_json = ?, version = version + 1, updated_at = ? WHERE user_id = ? AND version = ?",
                json, java.sql.Timestamp.from(now), user.id(), expectedVersion);
        if (updated != 1) throw workspaceConflict();
        return new WorkspaceResponse(data, currentVersion + 1);
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
        return new AuthException(HttpStatus.CONFLICT, "This workspace changed on another device. Reload the workplace before saving again.");
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
