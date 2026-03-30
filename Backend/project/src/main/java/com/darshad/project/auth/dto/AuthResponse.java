package com.darshad.project.auth.dto;

public record AuthResponse(
        String accessToken,
        String tokenType
) {}