package com.darshad.project.scan.dto;

import java.math.BigDecimal;
import java.util.UUID;

public record ScanResponse(
        UUID productId,
        String title,
        String description,
        BigDecimal price,
        String imageUrl,
        String barcode,
        int availableQuantity,
        boolean available,
        UUID storeId,
        String storeName
) {}