package com.darshad.project.auth.dto;

/**
 * Response shape for /api/auth/login, /register, /register/business and /refresh.
 *
 * Adds {@code refreshToken} for B11. The frontend stores it (e.g. in
 * SecureStore on RN) and uses it against {@code POST /api/auth/refresh}
 * once the access token expires. The {@code refreshToken} field is
 * omitted (null) for response shapes where one isn't issued.
 */
public record AuthResponse(
        String accessToken,
        String tokenType,
        String role,
        String refreshToken
) {
    public AuthResponse(String accessToken, String tokenType, String role) {
        this(accessToken, tokenType, role, null);
    }
}
