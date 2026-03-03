package com.darshad.project.catalog.product;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import jakarta.validation.constraints.Size;

import java.math.BigDecimal;
import java.util.List;
import java.util.UUID;

public record ProductUpsertRequest(
        @NotBlank @Size(max = 180) String title,
        String description,
        @NotNull @Positive BigDecimal price,
        String imageUrl,
        Boolean active,
        List<UUID> categoryIds
) {}