package edu.anu.ppm.auth;

import static edu.anu.ppm.auth.AuthModels.*;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.bind.annotation.RestControllerAdvice;

@RestController
@RequestMapping("/api/auth")
class AuthController {
    private final AuthService auth;

    AuthController(AuthService auth) {
        this.auth = auth;
    }

    @PostMapping("/register")
    ResponseEntity<AuthResponse> register(@RequestBody(required = false) RegisterRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(auth.register(request));
    }

    @PostMapping("/login")
    AuthResponse login(@RequestBody(required = false) LoginRequest request) {
        return auth.login(request);
    }

    @GetMapping("/me")
    UserResponse me(@RequestHeader(value = "Authorization", required = false) String authorization) {
        return auth.currentUser(bearer(authorization));
    }

    @PostMapping("/logout")
    ResponseEntity<Void> logout(@RequestHeader(value = "Authorization", required = false) String authorization) {
        auth.logout(bearer(authorization));
        return ResponseEntity.noContent().build();
    }

    private String bearer(String authorization) {
        if (authorization == null || !authorization.regionMatches(true, 0, "Bearer ", 0, 7)) return null;
        return authorization.substring(7).trim();
    }
}

@RestControllerAdvice
class AuthErrorHandler {
    @ExceptionHandler(AuthException.class)
    ResponseEntity<ApiError> authError(AuthException exception) {
        return ResponseEntity.status(exception.status()).body(new ApiError(exception.getMessage()));
    }
}
