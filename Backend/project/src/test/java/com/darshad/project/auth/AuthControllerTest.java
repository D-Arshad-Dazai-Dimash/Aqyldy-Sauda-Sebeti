package com.darshad.project.auth;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.Map;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
@DisplayName("AuthController")
class AuthControllerTest {

    @Mock
    private AuthService authService;

    @Test
    @DisplayName("forgot-password does not expose dev token when flag disabled")
    void forgotPasswordNoDevTokenWhenDisabled() {
        when(authService.forgotPassword("user@test.com")).thenReturn("secret-token");
        var controller = new AuthController(authService, false);

        Map<String, Object> res = controller.forgotPassword(new AuthController.ForgotPasswordRequest("user@test.com"));

        assertThat(res).containsEntry("ok", true);
        assertThat(res).doesNotContainKey("devResetToken");
    }

    @Test
    @DisplayName("forgot-password exposes dev token only when flag enabled")
    void forgotPasswordExposesTokenWhenEnabled() {
        when(authService.forgotPassword("user@test.com")).thenReturn("secret-token");
        var controller = new AuthController(authService, true);

        Map<String, Object> res = controller.forgotPassword(new AuthController.ForgotPasswordRequest("user@test.com"));

        assertThat(res).containsEntry("ok", true);
        assertThat(res).containsEntry("devResetToken", "secret-token");
    }
}
