package com.darshad.project.favorite;

import java.math.BigDecimal;
import java.time.OffsetDateTime;
import java.util.UUID;

public record FavoriteDto(
        UUID id,
        UUID productId,
        String title,
        BigDecimal price,
        BigDecimal discount,
        String imageUrl,
        boolean active,
        OffsetDateTime createdAt
) {}
