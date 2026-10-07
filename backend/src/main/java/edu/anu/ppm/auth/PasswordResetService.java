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
import java.util.UUID;

import org.springframework.beans.factory.ObjectProvider;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
class PasswordResetService {
    private static final SecureRandom RANDOM = new SecureRandom();
    private static final String REQUEST_MESSAGE =
            "If an account is linked to that email, password reset instructions will be sent.";

    private final JdbcTemplate jdbc;
    private final PasswordEncoder passwordEncoder;
    private final ObjectProvider<PasswordResetEmailSender> emailSender;
    private final String resetPageUrl;

    PasswordResetService(JdbcTemplate jdbc, PasswordEncoder passwordEncoder,
                         ObjectProvider<PasswordResetEmailSender> emailSender,
                         @Value("${ppm.password-reset.url}") String resetPageUrl) {
        this.jdbc = jdbc;
        this.passwordEncoder = passwordEncoder;
        this.emailSender = emailSender;
        this.resetPageUrl = resetPageUrl;
    }

    void requestReset(PasswordResetRequest request) {
        String email = cleanEmail(request == null ? null : request.email());
        PasswordResetEmailSender sender = emailSender.getIfAvailable();
        if (sender == null) {
            throw new AuthException(HttpStatus.SERVICE_UNAVAILABLE,
                    "Password reset email is not configured yet. Please contact the site administrator.");
        }

        List<UUID> users = jdbc.query("SELECT id FROM ppm_users WHERE email = ?",
                (result, row) -> result.getObject("id", UUID.class), email);
        if (users.isEmpty()) return;

        UUID userId = users.get(0);
        Instant now = Instant.now();
        jdbc.update("DELETE FROM ppm_password_reset_tokens WHERE expires_at <= ?",
                java.sql.Timestamp.from(now));
        Integer recentlySent = jdbc.queryForObject(
                "SELECT COUNT(*) FROM ppm_password_reset_tokens WHERE user_id = ? AND created_at > ?",
                Integer.class, userId, java.sql.Timestamp.from(now.minus(1, ChronoUnit.MINUTES)));
        if (recentlySent != null && recentlySent > 0) return;

        jdbc.update("DELETE FROM ppm_password_reset_tokens WHERE user_id = ?", userId);
        byte[] bytes = new byte[32];
        RANDOM.nextBytes(bytes);
        String token = Base64.getUrlEncoder().withoutPadding().encodeToString(bytes);
        String tokenHash = hash(token);
        jdbc.update("INSERT INTO ppm_password_reset_tokens (token_hash, user_id, expires_at, created_at) VALUES (?, ?, ?, ?)",
                tokenHash, userId, java.sql.Timestamp.from(now.plus(30, ChronoUnit.MINUTES)),
                java.sql.Timestamp.from(now));

        try {
            sender.sendResetLink(email, resetPageUrl + "#token=" + token);
        } catch (RuntimeException exception) {
            jdbc.update("DELETE FROM ppm_password_reset_tokens WHERE token_hash = ?", tokenHash);
            throw new AuthException(HttpStatus.SERVICE_UNAVAILABLE,
                    "We couldn't send a reset email just now. Please try again later.");
        }
    }

    @Transactional
    void confirmReset(PasswordResetConfirmRequest request) {
        String token = request == null || request.token() == null ? "" : request.token().trim();
        String password = cleanPassword(request == null ? null : request.password());
        if (token.length() < 32 || token.length() > 100) throw invalidToken();

        String tokenHash = hash(token);
        Instant now = Instant.now();
        List<UUID> userIds = jdbc.query(
                "SELECT user_id FROM ppm_password_reset_tokens WHERE token_hash = ? AND expires_at > ?",
                (result, row) -> result.getObject("user_id", UUID.class),
                tokenHash, java.sql.Timestamp.from(now));
        if (userIds.isEmpty()) throw invalidToken();

        UUID userId = userIds.get(0);
        jdbc.update("UPDATE ppm_users SET password_hash = ? WHERE id = ?", passwordEncoder.encode(password), userId);
        jdbc.update("DELETE FROM ppm_login_sessions WHERE user_id = ?", userId);
        jdbc.update("DELETE FROM ppm_password_reset_tokens WHERE user_id = ?", userId);
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
        if (bytes < 8 || bytes > 72) {
            throw new AuthException(HttpStatus.BAD_REQUEST, "Use a password between 8 and 72 bytes.");
        }
        return password;
    }

    private static AuthException invalidToken() {
        return new AuthException(HttpStatus.BAD_REQUEST,
                "This reset link is invalid or has expired. Request a new one and try again.");
    }

    private static String hash(String value) {
        try {
            byte[] digest = MessageDigest.getInstance("SHA-256").digest(value.getBytes(StandardCharsets.UTF_8));
            return java.util.HexFormat.of().formatHex(digest);
        } catch (Exception exception) {
            throw new IllegalStateException("SHA-256 is unavailable", exception);
        }
    }
}
