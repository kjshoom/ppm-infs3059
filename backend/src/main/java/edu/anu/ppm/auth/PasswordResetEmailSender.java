package edu.anu.ppm.auth;

interface PasswordResetEmailSender {
    void sendResetLink(String email, String resetLink);
}
