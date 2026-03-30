package com.darshad.project.user;

import java.util.UUID;

public record UserProfileDto(
        UUID id,
        String email,
        String name,
        String phone,
        String avatarUrl,
        String role
) {}
