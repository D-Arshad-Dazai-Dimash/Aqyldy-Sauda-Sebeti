package com.darshad.project.auth;

import com.darshad.project.auth.dto.AuthResponse;
import com.darshad.project.auth.dto.BusinessRegisterRequest;
import com.darshad.project.auth.dto.LoginRequest;
import com.darshad.project.auth.dto.RegisterRequest;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/auth")
@Tag(name = "Auth", description = "Authentication and account recovery")
public class AuthController {

    private final AuthService authService;
    private final boolean exposeDevResetToken;

    public AuthController(AuthService authService,
                          @Value("${app.security.expose-dev-reset-token:false}") boolean exposeDevResetToken) {
        this.authService = authService;
        this.exposeDevResetToken = exposeDevResetToken;
    }

    @PostMapping("/register")
    @Operation(summary = "Register user", description = "Creates a new customer account and returns access/refresh tokens.")
    @ApiResponse(responseCode = "200", description = "Registration completed")
    public AuthResponse register(@Valid @RequestBody RegisterRequest req) {
        return authService.register(req);
    }

    @PostMapping("/register/business")
    @Operation(summary = "Register business", description = "Creates a merchant account and returns access/refresh tokens.")
    @ApiResponse(responseCode = "200", description = "Business registration completed")
    public AuthResponse registerBusiness(@Valid @RequestBody BusinessRegisterRequest req) {
        return authService.registerBusiness(req);
    }

    @PostMapping("/login")
    @Operation(summary = "Login", description = "Authenticates user credentials and returns JWT tokens.")
    @ApiResponse(responseCode = "200", description = "Login successful")
    public AuthResponse login(@Valid @RequestBody LoginRequest req) {
        return authService.login(req);
    }

    // ===========================================================
    // B11 — refresh access token
    // ===========================================================
    @PostMapping("/refresh")
    @Operation(summary = "Refresh access token", description = "Exchanges a valid refresh token for a new access token.")
    @ApiResponse(responseCode = "200", description = "Token refreshed")
    public AuthResponse refresh(@Valid @RequestBody RefreshRequest req) {
        return authService.refresh(req.refreshToken());
    }

    // ===========================================================
    // B12 — logout (revoke refresh token)
    // ===========================================================
    @PostMapping("/logout")
    @Operation(summary = "Logout", description = "Revokes refresh token. Access token naturally expires.")
    @ApiResponse(responseCode = "200", description = "Logout successful")
    public Map<String, Object> logout(@RequestBody(required = false) RefreshRequest req) {
        authService.logout(req == null ? null : req.refreshToken());
        return Map.of("ok", true);
    }

    // ===========================================================
    // B13 — password reset (forgot / reset)
    // ===========================================================
    @PostMapping("/forgot-password")
    @Operation(summary = "Forgot password", description = "Issues password reset token and sends reset instructions.")
    @ApiResponse(responseCode = "200", description = "Reset flow started")
    public Map<String, Object> forgotPassword(@Valid @RequestBody ForgotPasswordRequest req) {
        String token = authService.forgotPassword(req.email());
        if (exposeDevResetToken && token != null) {
            return Map.of("ok", true, "devResetToken", token);
        }
        return Map.of("ok", true);
    }

    @PostMapping("/reset-password")
    @Operation(summary = "Reset password", description = "Resets password using a valid one-time reset token.")
    @ApiResponse(responseCode = "200", description = "Password reset completed")
    public Map<String, Object> resetPassword(@Valid @RequestBody ResetPasswordRequest req) {
        authService.resetPassword(req.token(), req.newPassword());
        return Map.of("ok", true);
    }

    public record RefreshRequest(@NotBlank String refreshToken) {}
    public record ForgotPasswordRequest(@NotBlank @Email String email) {}
    public record ResetPasswordRequest(@NotBlank String token,
                                       @NotBlank @Size(min = 6) String newPassword) {}
}
