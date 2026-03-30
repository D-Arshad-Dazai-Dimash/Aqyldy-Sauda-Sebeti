package com.darshad.project.user;

public record UpdateProfileRequest(
        String name,
        String phone,
        String avatarUrl
) {}
