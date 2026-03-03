package com.darshad.project.catalog.product;

import java.math.BigDecimal;
import java.util.List;
import java.util.UUID;

public record ProductDto(
        UUID id,
        String title,
        String description,
        BigDecimal price,
        String imageUrl,
        boolean active,
        List<UUID> categoryIds
) {}