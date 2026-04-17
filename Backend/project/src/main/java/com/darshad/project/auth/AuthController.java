package com.darshad.project.auth;

import com.darshad.project.auth.dto.AuthResponse;
import com.darshad.project.auth.dto.BusinessRegisterRequest;
import com.darshad.project.auth.dto.LoginRequest;
import com.darshad.project.auth.dto.RegisterRequest;
import jakarta.validation.Valid;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

    private final AuthService authService;
    private final boolean exposeDevResetToken;

    public AuthController(AuthService authService,
                          @Value("${app.security.expose-dev-reset-token:false}") boolean exposeDevResetToken) {
        this.authService = authService;
        this.exposeDevResetToken = exposeDevResetToken;
    }

    @PostMapping("/register")
    public AuthResponse register(@Valid @RequestBody RegisterRequest req) {
        return authService.register(req);
    }

    @PostMapping("/register/business")
    public AuthResponse registerBusiness(@Valid @RequestBody BusinessRegisterRequest req) {
        return authService.registerBusiness(req);
    }

    @PostMapping("/login")
    public AuthResponse login(@Valid @RequestBody LoginRequest req) {
        return authService.login(req);
    }

    // ===========================================================
    // B11 — refresh access token
    // ===========================================================
    @PostMapping("/refresh")
    public AuthResponse refresh(@Valid @RequestBody RefreshRequest req) {
        return authService.refresh(req.refreshToken());
    }

    // ===========================================================
    // B12 — logout (revoke refresh token)
    // ===========================================================
    @PostMapping("/logout")
    public Map<String, Object> logout(@RequestBody(required = false) RefreshRequest req) {
        authService.logout(req == null ? null : req.refreshToken());
        return Map.of("ok", true);
    }

    // ===========================================================
    // B13 — password reset (forgot / reset)
    // ===========================================================
    @PostMapping("/forgot-password")
    public Map<String, Object> forgotPassword(@Valid @RequestBody ForgotPasswordRequest req) {
        String token = authService.forgotPassword(req.email());
        if (exposeDevResetToken && token != null) {
            return Map.of("ok", true, "devResetToken", token);
        }
        return Map.of("ok", true);
    }

    @PostMapping("/reset-password")
    public Map<String, Object> resetPassword(@Valid @RequestBody ResetPasswordRequest req) {
        authService.resetPassword(req.token(), req.newPassword());
        return Map.of("ok", true);
    }

    public record RefreshRequest(@NotBlank String refreshToken) {}
    public record ForgotPasswordRequest(@NotBlank @Email String email) {}
    public record ResetPasswordRequest(@NotBlank String token,
                                       @NotBlank @Size(min = 6) String newPassword) {}
}
