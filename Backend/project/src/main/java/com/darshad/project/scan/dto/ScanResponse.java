package com.darshad.project.scan.dto;

import java.math.BigDecimal;
import java.util.UUID;

public record ScanResponse(
        UUID id,
        String title,
        String description,
        BigDecimal price,
        String imageUrl,
        String barcode,
        int quantity,
        boolean available,
        UUID storeId,
        String storeName
) {}