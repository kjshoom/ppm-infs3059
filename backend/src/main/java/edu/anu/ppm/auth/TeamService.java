package edu.anu.ppm.auth;

import static edu.anu.ppm.auth.AuthModels.*;

import java.security.SecureRandom;
import java.time.Instant;
import java.util.List;
import java.util.Locale;
import java.util.UUID;

import org.springframework.dao.DuplicateKeyException;
import org.springframework.http.HttpStatus;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
class TeamService {
    private static final SecureRandom RANDOM = new SecureRandom();
    private static final String CODE_ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
    private final JdbcTemplate jdbc;

    TeamService(JdbcTemplate jdbc) {
        this.jdbc = jdbc;
    }

    UUID activeTeamId(UUID userId) {
        List<UUID> teams = jdbc.query("SELECT team_id FROM ppm_team_memberships WHERE user_id = ?",
                (result, row) -> result.getObject("team_id", UUID.class), userId);
        return teams.isEmpty() ? null : teams.get(0);
    }

    TeamResponse currentTeam(UUID userId) {
        UUID teamId = activeTeamId(userId);
        return teamId == null ? null : teamDetails(userId, teamId);
    }

    @Transactional
    TeamResponse create(UUID userId, TeamCreateRequest request) {
        if (activeTeamId(userId) != null) throw conflict("You already belong to a team workspace.");
        String name = request == null || request.name() == null ? "" : request.name().trim();
        if (name.length() < 2 || name.length() > 80) {
            throw new AuthException(HttpStatus.BAD_REQUEST, "Enter a team name between 2 and 80 characters.");
        }

        UUID teamId = UUID.randomUUID();
        String inviteCode = newInviteCode();
        Instant now = Instant.now();
        try {
            jdbc.update("INSERT INTO ppm_teams (id, name, invite_code, owner_user_id, created_at) VALUES (?, ?, ?, ?, ?)",
                    teamId, name, inviteCode, userId, java.sql.Timestamp.from(now));
        } catch (DuplicateKeyException exception) {
            throw conflict("Could not create a team right now. Please try again.");
        }
        jdbc.update("INSERT INTO ppm_team_memberships (team_id, user_id, member_role, created_at) VALUES (?, ?, 'OWNER', ?)",
                teamId, userId, java.sql.Timestamp.from(now));

        List<StoredWorkspace> existing = jdbc.query(
                "SELECT workspace_json, version FROM ppm_workspace_data WHERE user_id = ?",
                (result, row) -> new StoredWorkspace(result.getString("workspace_json"), result.getLong("version")), userId);
        String json = existing.isEmpty() ? "{}" : existing.get(0).json();
        long version = existing.isEmpty() || existing.get(0).version() == 0 ? 0 : 1;
        jdbc.update("INSERT INTO ppm_team_workspace_data (team_id, workspace_json, version, updated_at) VALUES (?, ?, ?, ?)",
                teamId, json, version, java.sql.Timestamp.from(now));
        return teamDetails(userId, teamId);
    }

    @Transactional
    TeamResponse join(UUID userId, TeamJoinRequest request) {
        String code = request == null || request.inviteCode() == null ? ""
                : request.inviteCode().replaceAll("[^A-Za-z0-9]", "").toUpperCase(Locale.ROOT);
        if (code.length() != 10) throw new AuthException(HttpStatus.BAD_REQUEST, "This invitation link is incomplete.");
        List<UUID> matching = jdbc.query("SELECT id FROM ppm_teams WHERE invite_code = ?",
                (result, row) -> result.getObject("id", UUID.class), code);
        if (matching.isEmpty()) throw new AuthException(HttpStatus.NOT_FOUND, "This team invitation is no longer available.");
        UUID invitedTeam = matching.get(0);
        UUID currentTeam = activeTeamId(userId);
        if (currentTeam != null) {
            if (currentTeam.equals(invitedTeam)) return teamDetails(userId, invitedTeam);
            throw conflict("Leave your current team before joining another one.");
        }
        try {
            jdbc.update("INSERT INTO ppm_team_memberships (team_id, user_id, member_role, created_at) VALUES (?, ?, 'MEMBER', ?)",
                    invitedTeam, userId, java.sql.Timestamp.from(Instant.now()));
        } catch (DuplicateKeyException exception) {
            throw conflict("This account already belongs to a team workspace.");
        }
        return teamDetails(userId, invitedTeam);
    }

    @Transactional
    void leave(UUID userId) {
        UUID teamId = activeTeamId(userId);
        if (teamId == null) return;
        List<String> roles = jdbc.query("SELECT member_role FROM ppm_team_memberships WHERE team_id = ? AND user_id = ?",
                (result, row) -> result.getString("member_role"), teamId, userId);
        if (roles.isEmpty()) return;
        int count = memberCount(teamId);
        if ("OWNER".equals(roles.get(0)) && count > 1) {
            throw conflict("Transfer team ownership before leaving this team.");
        }
        if (count == 1) jdbc.update("DELETE FROM ppm_teams WHERE id = ?", teamId);
        else jdbc.update("DELETE FROM ppm_team_memberships WHERE team_id = ? AND user_id = ?", teamId, userId);
    }

    @Transactional
    TeamResponse transferOwnership(UUID userId, TeamTransferRequest request) {
        UUID teamId = activeTeamId(userId);
        if (teamId == null) throw new AuthException(HttpStatus.NOT_FOUND, "You are not in a team workspace.");
        requireOwner(teamId, userId);
        String email = request == null || request.email() == null ? "" : request.email().trim().toLowerCase(Locale.ROOT);
        if (email.isBlank() || email.length() > 254) throw new AuthException(HttpStatus.BAD_REQUEST, "Choose a team member.");
        List<UUID> recipients = jdbc.query(
                "SELECT m.user_id FROM ppm_team_memberships m JOIN ppm_users u ON u.id = m.user_id " +
                        "WHERE m.team_id = ? AND u.email = ? AND m.user_id <> ?",
                (result, row) -> result.getObject("user_id", UUID.class), teamId, email, userId);
        if (recipients.isEmpty()) throw new AuthException(HttpStatus.BAD_REQUEST, "Choose another member of this team.");
        UUID recipientId = recipients.get(0);
        jdbc.update("UPDATE ppm_team_memberships SET member_role = 'MEMBER' WHERE team_id = ? AND user_id = ?", teamId, userId);
        jdbc.update("UPDATE ppm_team_memberships SET member_role = 'OWNER' WHERE team_id = ? AND user_id = ?", teamId, recipientId);
        jdbc.update("UPDATE ppm_teams SET owner_user_id = ? WHERE id = ?", recipientId, teamId);
        return teamDetails(userId, teamId);
    }

    @Transactional
    void prepareAccountDeletion(UUID userId) {
        List<UUID> ownedTeams = jdbc.query("SELECT id FROM ppm_teams WHERE owner_user_id = ?",
                (result, row) -> result.getObject("id", UUID.class), userId);
        for (UUID teamId : ownedTeams) {
            List<UUID> successors = jdbc.query(
                    "SELECT user_id FROM ppm_team_memberships WHERE team_id = ? AND user_id <> ? ORDER BY created_at, user_id LIMIT 1",
                    (result, row) -> result.getObject("user_id", UUID.class), teamId, userId);
            if (successors.isEmpty()) {
                jdbc.update("DELETE FROM ppm_teams WHERE id = ?", teamId);
            } else {
                UUID successor = successors.get(0);
                jdbc.update("UPDATE ppm_team_memberships SET member_role = 'MEMBER' WHERE team_id = ? AND member_role = 'OWNER'", teamId);
                jdbc.update("UPDATE ppm_team_memberships SET member_role = 'OWNER' WHERE team_id = ? AND user_id = ?", teamId, successor);
                jdbc.update("UPDATE ppm_teams SET owner_user_id = ? WHERE id = ?", successor, teamId);
            }
        }
    }

    private TeamResponse teamDetails(UUID userId, UUID teamId) {
        List<String[]> rows = jdbc.query(
                "SELECT t.name, t.invite_code, m.member_role FROM ppm_teams t " +
                        "JOIN ppm_team_memberships m ON m.team_id = t.id WHERE t.id = ? AND m.user_id = ?",
                (result, row) -> new String[] { result.getString("name"), result.getString("invite_code"), result.getString("member_role") },
                teamId, userId);
        if (rows.isEmpty()) throw new AuthException(HttpStatus.NOT_FOUND, "This team workspace is no longer available.");
        List<TeamMember> members = jdbc.query(
                "SELECT u.id, u.display_name, u.email, m.member_role FROM ppm_team_memberships m " +
                        "JOIN ppm_users u ON u.id = m.user_id WHERE m.team_id = ? ORDER BY m.created_at, u.display_name",
                (result, row) -> new TeamMember(result.getObject("id", UUID.class), result.getString("display_name"),
                        result.getString("email"), result.getString("member_role")), teamId);
        String[] team = rows.get(0);
        return new TeamResponse(teamId, team[0], team[1], team[2], members.size(), members);
    }

    private int memberCount(UUID teamId) {
        Integer count = jdbc.queryForObject("SELECT COUNT(*) FROM ppm_team_memberships WHERE team_id = ?", Integer.class, teamId);
        return count == null ? 0 : count;
    }

    private void requireOwner(UUID teamId, UUID userId) {
        List<String> roles = jdbc.query("SELECT member_role FROM ppm_team_memberships WHERE team_id = ? AND user_id = ?",
                (result, row) -> result.getString("member_role"), teamId, userId);
        if (roles.isEmpty() || !"OWNER".equals(roles.get(0))) {
            throw new AuthException(HttpStatus.FORBIDDEN, "Only the team owner can transfer ownership.");
        }
    }

    private String newInviteCode() {
        StringBuilder code = new StringBuilder(10);
        for (int index = 0; index < 10; index++) code.append(CODE_ALPHABET.charAt(RANDOM.nextInt(CODE_ALPHABET.length())));
        return code.toString();
    }

    private static AuthException conflict(String message) {
        return new AuthException(HttpStatus.CONFLICT, message);
    }
}
