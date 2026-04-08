package com.darshad.project.admin;

import java.math.BigDecimal;
import java.util.UUID;

public record InventoryItemResponse(
        UUID productId,
        String title,
        BigDecimal price,
        String imageUrl,
        int quantity
) {}
