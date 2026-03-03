package com.darshad.project.catalog.category;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record CategoryCreateRequest(
        @NotBlank @Size(max = 120) String name,
        @NotBlank @Size(max = 140) String slug
) {}