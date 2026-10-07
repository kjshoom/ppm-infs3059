package edu.anu.ppm.auth;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.mail.MailException;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.stereotype.Component;

@Component
@ConditionalOnProperty(prefix = "ppm.password-reset", name = "mail-enabled", havingValue = "true")
final class SmtpPasswordResetEmailSender implements PasswordResetEmailSender {
    private final JavaMailSender mailSender;
    private final String from;

    SmtpPasswordResetEmailSender(JavaMailSender mailSender,
                                 @Value("${ppm.mail.from:}") String from) {
        this.mailSender = mailSender;
        this.from = from == null ? "" : from.trim();
    }

    @Override
    public void sendResetLink(String email, String resetLink) throws MailException {
        if (from.isBlank()) throw new IllegalStateException("A password-reset sender address has not been configured.");
        SimpleMailMessage message = new SimpleMailMessage();
        message.setFrom(from);
        message.setTo(email);
        message.setSubject("Reset your PPM password");
        message.setText("We received a request to reset the password for your PPM account.\n\n"
                + "Use this one-time link within 30 minutes:\n" + resetLink + "\n\n"
                + "If you did not request this, you can ignore this email.");
        mailSender.send(message);
    }
}
