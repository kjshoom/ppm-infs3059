package edu.anu.ppm.auth;

import static edu.anu.ppm.auth.AuthModels.WorkspaceRequest;
import static edu.anu.ppm.auth.AuthModels.WorkspaceResponse;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/workspace")
class WorkspaceController {
    private final AuthService auth;

    WorkspaceController(AuthService auth) {
        this.auth = auth;
    }

    @GetMapping
    WorkspaceResponse read(@RequestHeader(value = "Authorization", required = false) String authorization) {
        return auth.readWorkspace(bearer(authorization));
    }

    @PutMapping
    WorkspaceResponse save(@RequestHeader(value = "Authorization", required = false) String authorization,
                           @RequestBody(required = false) WorkspaceRequest request) {
        return auth.saveWorkspace(bearer(authorization), request);
    }

    private String bearer(String authorization) {
        if (authorization == null || !authorization.regionMatches(true, 0, "Bearer ", 0, 7)) return null;
        return authorization.substring(7).trim();
    }
}
