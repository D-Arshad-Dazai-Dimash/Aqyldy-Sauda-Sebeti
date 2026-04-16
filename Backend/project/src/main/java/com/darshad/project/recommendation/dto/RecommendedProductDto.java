package com.darshad.project.recommendation.dto;

import java.math.BigDecimal;
import java.util.UUID;

public record RecommendedProductDto(
        UUID id,
        String title,
        BigDecimal price,
        BigDecimal discount,
        String imageUrl,
        boolean active,
        double score
) {}
