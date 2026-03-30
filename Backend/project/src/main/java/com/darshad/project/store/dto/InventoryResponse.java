package com.darshad.project.store.dto;

import java.math.BigDecimal;
import java.util.UUID;

public record InventoryResponse(
        UUID productId,
        String productTitle,
        BigDecimal price,
        String imageUrl,
        int quantity
) {}