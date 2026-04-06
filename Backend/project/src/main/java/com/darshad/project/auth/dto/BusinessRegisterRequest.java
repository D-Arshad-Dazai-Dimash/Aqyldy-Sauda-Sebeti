package com.darshad.project.auth.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record BusinessRegisterRequest(
        @NotBlank @Email String email,
        @NotBlank @Size(min = 6) String password,
        String name,
        @NotBlank @Size(max = 200) String storeName,
        @Size(max = 300) String storeAddress,
        @Size(max = 20) String phone,
        @Size(max = 20) String bin,
        @Size(max = 100) String workingHours
) {}
