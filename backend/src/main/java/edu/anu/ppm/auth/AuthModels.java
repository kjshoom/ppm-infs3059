package edu.anu.ppm.auth;

import java.time.Instant;
import java.util.Map;
import java.util.UUID;

final class AuthModels {
    private AuthModels() {}

    record RegisterRequest(String name, String email, String password, String role) {}
    record LoginRequest(String email, String password) {}
    record PasswordResetRequest(String email) {}
    record PasswordResetConfirmRequest(String token, String password) {}
    record MessageResponse(String message) {}
    record ProfileUpdateRequest(String name, String email, String role) {}
    record UserResponse(UUID id, String name, String email, String role, Instant createdAt) {}
    record AuthResponse(String token, UserResponse user) {}
    record ApiError(String message) {}
    record WorkspaceRequest(Map<String, String> data, Long expectedVersion, String scopeId) {}
    record WorkspaceResponse(String scopeId, Map<String, String> data, long version) {}
    record StoredWorkspace(String json, long version) {}
    record TeamCreateRequest(String name) {}
    record TeamJoinRequest(String inviteCode) {}
    record TeamTransferRequest(String email) {}
    record TeamMember(UUID id, String name, String email, String role) {}
    record TeamResponse(UUID id, String name, String inviteCode, String role, int memberCount,
                        java.util.List<TeamMember> members) {}
    record TeamState(TeamResponse team) {}
    record StoredUser(UUID id, String name, String email, String passwordHash, String role, Instant createdAt) {
        UserResponse toResponse() {
            return new UserResponse(id, name, email, role, createdAt);
        }
    }
}
