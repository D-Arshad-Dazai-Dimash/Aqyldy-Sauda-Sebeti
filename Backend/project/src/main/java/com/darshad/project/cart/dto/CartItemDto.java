package com.darshad.project.cart.dto;

import java.math.BigDecimal;
import java.util.UUID;

public record CartItemDto(
        UUID id,
        UUID productId,
        String title,
        BigDecimal price,
        String imageUrl,
        int quantity,
        BigDecimal lineTotal
) {}