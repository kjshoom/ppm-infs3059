package edu.anu.ppm.auth;

import static edu.anu.ppm.auth.AuthModels.*;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/team")
class TeamController {
    private final AuthService auth;
    private final TeamService teams;

    TeamController(AuthService auth, TeamService teams) {
        this.auth = auth;
        this.teams = teams;
    }

    @GetMapping
    TeamState current(@RequestHeader(value = "Authorization", required = false) String authorization) {
        return new TeamState(teams.currentTeam(auth.currentUser(bearer(authorization)).id()));
    }

    @PostMapping
    ResponseEntity<TeamResponse> create(@RequestHeader(value = "Authorization", required = false) String authorization,
                                        @RequestBody(required = false) TeamCreateRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(teams.create(auth.currentUser(bearer(authorization)).id(), request));
    }

    @PostMapping("/join")
    TeamResponse join(@RequestHeader(value = "Authorization", required = false) String authorization,
                      @RequestBody(required = false) TeamJoinRequest request) {
        return teams.join(auth.currentUser(bearer(authorization)).id(), request);
    }

    @PostMapping("/transfer")
    TeamResponse transfer(@RequestHeader(value = "Authorization", required = false) String authorization,
                          @RequestBody(required = false) TeamTransferRequest request) {
        return teams.transferOwnership(auth.currentUser(bearer(authorization)).id(), request);
    }

    @DeleteMapping
    ResponseEntity<Void> leave(@RequestHeader(value = "Authorization", required = false) String authorization) {
        teams.leave(auth.currentUser(bearer(authorization)).id());
        return ResponseEntity.noContent().build();
    }

    private String bearer(String authorization) {
        if (authorization == null || !authorization.regionMatches(true, 0, "Bearer ", 0, 7)) return null;
        return authorization.substring(7).trim();
    }
}
