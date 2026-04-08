package com.darshad.project.catalog.pricehistory.dto;

import java.math.BigDecimal;
import java.time.OffsetDateTime;
import java.util.List;
import java.util.UUID;

public record PriceInsightDto(
        UUID productId,
        BigDecimal currentPrice,
        BigDecimal averagePrice,
        BigDecimal lowestPrice,
        BigDecimal highestPrice,
        double changePercentage,
        String trend,
        boolean goodDeal,
        List<PricePointDto> history
) {

    public record PricePointDto(
            BigDecimal price,
            OffsetDateTime date
    ) {}
}
