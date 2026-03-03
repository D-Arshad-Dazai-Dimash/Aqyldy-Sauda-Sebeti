package com.darshad.project.order;

import java.math.BigDecimal;
import java.time.OffsetDateTime;
import java.util.UUID;

public record OrderResponse(
        UUID id,
        UUID storeId,
        String status,
        BigDecimal totalAmount,
        OffsetDateTime createdAt
) {}