package com.darshad.project.order;

import java.math.BigDecimal;
import java.time.OffsetDateTime;
import java.util.List;
import java.util.UUID;

public record OrderDetailResponse(
        UUID id,
        UUID storeId,
        String storeName,
        String status,
        BigDecimal totalAmount,
        String comment,
        OffsetDateTime createdAt,
        List<OrderItemDetail> items
) {
    public record OrderItemDetail(
            UUID id,
            UUID productId,
            String productName,
            String imageUrl,
            int quantity,
            BigDecimal price,
            BigDecimal lineTotal
    ) {}
}
