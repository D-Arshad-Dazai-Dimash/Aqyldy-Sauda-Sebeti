package com.darshad.project.auth.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

public record BusinessRegisterRequest(
        @NotBlank @Email String email,
        @NotBlank @Size(min = 6) String password,
        String name,
        @NotBlank @Size(max = 200) String storeName,
        @Size(max = 300) String storeAddress,
        @Size(max = 20) String phone,
        @Pattern(regexp = "^\\d{12}$", message = "BIN must be exactly 12 digits") String bin,
        @Size(max = 100) String workingHours,
        Double latitude,
        Double longitude
) {}
