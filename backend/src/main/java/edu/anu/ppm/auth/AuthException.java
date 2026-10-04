package edu.anu.ppm.auth;

import org.springframework.http.HttpStatus;

final class AuthException extends RuntimeException {
    private final HttpStatus status;

    AuthException(HttpStatus status, String message) {
        super(message);
        this.status = status;
    }

    HttpStatus status() {
        return status;
    }
}
