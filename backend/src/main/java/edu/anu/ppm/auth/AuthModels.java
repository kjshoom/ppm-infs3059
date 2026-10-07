package edu.anu.ppm.auth;

import java.time.Instant;
import java.util.Map;
import java.util.UUID;

final class AuthModels {
    private AuthModels() {}

    record RegisterRequest(String name, String email, String password, String role) {}
    record LoginRequest(String email, String password) {}
    record ProfileUpdateRequest(String name, String email, String role) {}
    record UserResponse(UUID id, String name, String email, String role, Instant createdAt) {}
    record AuthResponse(String token, UserResponse user) {}
    record ApiError(String message) {}
    record WorkspaceRequest(Map<String, String> data, Long expectedVersion) {}
    record WorkspaceResponse(Map<String, String> data, long version) {}
    record StoredWorkspace(String json, long version) {}
    record StoredUser(UUID id, String name, String email, String passwordHash, String role, Instant createdAt) {
        UserResponse toResponse() {
            return new UserResponse(id, name, email, role, createdAt);
        }
    }
}
