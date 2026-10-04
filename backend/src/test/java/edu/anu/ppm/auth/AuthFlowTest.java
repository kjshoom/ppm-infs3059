package edu.anu.ppm.auth;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
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

    private static String field(String json, String name) {
        Matcher matcher = Pattern.compile("\\\"" + Pattern.quote(name) + "\\\"\\s*:\\s*\\\"([^\\\"]*)\\\"").matcher(json);
        if (!matcher.find()) throw new AssertionError("Missing JSON field: " + name);
        return matcher.group(1);
    }
}
