package edu.anu.ppm.auth;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.options;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.patch;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import java.util.regex.Matcher;
import java.util.regex.Pattern;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;

@SpringBootTest(properties = {
        "spring.datasource.url=jdbc:h2:mem:ppm;MODE=PostgreSQL;DB_CLOSE_DELAY=-1",
        "spring.datasource.username=sa",
        "spring.datasource.password=",
        "spring.datasource.driver-class-name=org.h2.Driver"
})
@AutoConfigureMockMvc
class AuthFlowTest {
    @Autowired
    MockMvc http;

    @Test
    void accountCanBeCreatedUsedOnAnotherSignInAndLoggedOut() throws Exception {
        String email = "test-" + System.nanoTime() + "@example.com";
        String signup = "{\"name\":\"Test Reviewer\",\"email\":\"" + email + "\",\"password\":\"project-ppm-2026\",\"role\":\"Reviewer\"}";
        MvcResult created = http.perform(post("/api/auth/register").contentType(MediaType.APPLICATION_JSON).content(signup))
                .andExpect(status().isCreated()).andReturn();
        String createBody = created.getResponse().getContentAsString();
        String createdToken = field(createBody, "token");
        String createdUserId = field(createBody, "id");
        assertThat(createdToken).isNotBlank();
        assertThat(createdUserId).isNotBlank();
        assertThat(createBody).contains(email);

        String signin = "{\"email\":\"" + email + "\",\"password\":\"project-ppm-2026\"}";
        MvcResult signedIn = http.perform(post("/api/auth/login").contentType(MediaType.APPLICATION_JSON).content(signin))
                .andExpect(status().isOk()).andReturn();
        String token = field(signedIn.getResponse().getContentAsString(), "token");
        assertThat(field(signedIn.getResponse().getContentAsString(), "id")).isEqualTo(createdUserId);

        MvcResult me = http.perform(get("/api/auth/me").header("Authorization", "Bearer " + token))
                .andExpect(status().isOk()).andReturn();
        assertThat(field(me.getResponse().getContentAsString(), "id")).isEqualTo(createdUserId);

        http.perform(post("/api/auth/logout").header("Authorization", "Bearer " + token))
                .andExpect(status().isNoContent());
        http.perform(get("/api/auth/me").header("Authorization", "Bearer " + token))
                .andExpect(status().isUnauthorized());
    }

    @Test
    void incorrectPasswordIsRejected() throws Exception {
        String email = "test-" + System.nanoTime() + "@example.com";
        String signup = "{\"name\":\"Test Reviewer\",\"email\":\"" + email + "\",\"password\":\"project-ppm-2026\",\"role\":\"Reviewer\"}";
        http.perform(post("/api/auth/register").contentType(MediaType.APPLICATION_JSON).content(signup))
                .andExpect(status().isCreated());
        String wrongPassword = "{\"email\":\"" + email + "\",\"password\":\"wrong-password\"}";
        http.perform(post("/api/auth/login").contentType(MediaType.APPLICATION_JSON).content(wrongPassword))
                .andExpect(status().isUnauthorized());
    }

    @Test
    void signedInUserCanUpdateProfileAndRole() throws Exception {
        String email = "profile-" + System.nanoTime() + "@example.com";
        String signup = "{\"name\":\"Original Name\",\"email\":\"" + email + "\",\"password\":\"project-ppm-2026\",\"role\":\"Reviewer\"}";
        MvcResult created = http.perform(post("/api/auth/register").contentType(MediaType.APPLICATION_JSON).content(signup))
                .andExpect(status().isCreated()).andReturn();
        String token = field(created.getResponse().getContentAsString(), "token");
        String updatedEmail = "updated-" + email;
        String update = "{\"name\":\"Updated Name\",\"email\":\"" + updatedEmail + "\",\"role\":\"Portfolio Manager\"}";

        http.perform(patch("/api/auth/profile").header("Authorization", "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON).content(update))
                .andExpect(status().isOk())
                .andExpect(org.springframework.test.web.servlet.result.MockMvcResultMatchers.content().string(org.hamcrest.Matchers.containsString("Updated Name")))
                .andExpect(org.springframework.test.web.servlet.result.MockMvcResultMatchers.content().string(org.hamcrest.Matchers.containsString(updatedEmail)))
                .andExpect(org.springframework.test.web.servlet.result.MockMvcResultMatchers.content().string(org.hamcrest.Matchers.containsString("Portfolio Manager")));

        MvcResult me = http.perform(get("/api/auth/me").header("Authorization", "Bearer " + token))
                .andExpect(status().isOk()).andReturn();
        assertThat(me.getResponse().getContentAsString()).contains("Updated Name", updatedEmail, "Portfolio Manager");
    }

    @Test
    void profileEmailCannotBeChangedToAnotherAccountsEmail() throws Exception {
        String firstEmail = "first-" + System.nanoTime() + "@example.com";
        String secondEmail = "second-" + System.nanoTime() + "@example.com";
        String firstSignup = "{\"name\":\"First User\",\"email\":\"" + firstEmail + "\",\"password\":\"project-ppm-2026\",\"role\":\"Reviewer\"}";
        String secondSignup = "{\"name\":\"Second User\",\"email\":\"" + secondEmail + "\",\"password\":\"project-ppm-2026\",\"role\":\"Project Proposer\"}";
        MvcResult first = http.perform(post("/api/auth/register").contentType(MediaType.APPLICATION_JSON).content(firstSignup))
                .andExpect(status().isCreated()).andReturn();
        http.perform(post("/api/auth/register").contentType(MediaType.APPLICATION_JSON).content(secondSignup))
                .andExpect(status().isCreated());
        String token = field(first.getResponse().getContentAsString(), "token");
        String update = "{\"name\":\"First User\",\"email\":\"" + secondEmail + "\",\"role\":\"Reviewer\"}";

        http.perform(patch("/api/auth/profile").header("Authorization", "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON).content(update))
                .andExpect(status().isConflict());
    }

    @Test
    void profileUpdatesAllowBrowserPreflightRequests() throws Exception {
        MvcResult preflight = http.perform(options("/api/auth/profile")
                        .header("Origin", "https://kjshoom.github.io")
                        .header("Access-Control-Request-Method", "PATCH")
                        .header("Access-Control-Request-Headers", "authorization,content-type"))
                .andExpect(status().isOk()).andReturn();

        assertThat(preflight.getResponse().getHeader("Access-Control-Allow-Methods")).contains("PATCH");
    }

    @Test
    void deletingAccountInvalidatesAllSessionsAndRemovesCredentials() throws Exception {
        String email = "delete-" + System.nanoTime() + "@example.com";
        String signup = "{\"name\":\"Delete Me\",\"email\":\"" + email + "\",\"password\":\"project-ppm-2026\",\"role\":\"Reviewer\"}";
        MvcResult created = http.perform(post("/api/auth/register").contentType(MediaType.APPLICATION_JSON).content(signup))
                .andExpect(status().isCreated()).andReturn();
        String firstToken = field(created.getResponse().getContentAsString(), "token");
        String login = "{\"email\":\"" + email + "\",\"password\":\"project-ppm-2026\"}";
        MvcResult secondSession = http.perform(post("/api/auth/login").contentType(MediaType.APPLICATION_JSON).content(login))
                .andExpect(status().isOk()).andReturn();
        String secondToken = field(secondSession.getResponse().getContentAsString(), "token");

        http.perform(delete("/api/auth/account").header("Authorization", "Bearer " + firstToken))
                .andExpect(status().isNoContent());
        http.perform(get("/api/auth/me").header("Authorization", "Bearer " + firstToken))
                .andExpect(status().isUnauthorized());
        http.perform(get("/api/auth/me").header("Authorization", "Bearer " + secondToken))
                .andExpect(status().isUnauthorized());
        http.perform(post("/api/auth/login").contentType(MediaType.APPLICATION_JSON).content(login))
                .andExpect(status().isUnauthorized());
    }

    @Test
    void accountDeletionAllowsBrowserPreflightRequests() throws Exception {
        MvcResult preflight = http.perform(options("/api/auth/account")
                        .header("Origin", "https://kjshoom.github.io")
                        .header("Access-Control-Request-Method", "DELETE")
                        .header("Access-Control-Request-Headers", "authorization"))
                .andExpect(status().isOk()).andReturn();

        assertThat(preflight.getResponse().getHeader("Access-Control-Allow-Methods")).contains("DELETE");
    }

    private static String field(String json, String name) {
        Matcher matcher = Pattern.compile("\\\"" + Pattern.quote(name) + "\\\"\\s*:\\s*\\\"([^\\\"]*)\\\"").matcher(json);
        if (!matcher.find()) throw new AssertionError("Missing JSON field: " + name);
        return matcher.group(1);
    }
}
