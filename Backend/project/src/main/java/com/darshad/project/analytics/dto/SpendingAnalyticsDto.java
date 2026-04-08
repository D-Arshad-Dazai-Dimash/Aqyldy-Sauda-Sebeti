package com.darshad.project.analytics.dto;

import java.math.BigDecimal;
import java.util.List;
import java.util.UUID;

public record SpendingAnalyticsDto(
        BigDecimal totalSpent,
        BigDecimal averageOrderAmount,
        int orderCount,
        List<MonthlySpendingDto> monthlyTrend,
        List<CategorySpendingDto> categoryBreakdown,
        BigDecimal predictedNextMonthSpending,
        List<FrequentProductDto> frequentProducts
) {

    public record MonthlySpendingDto(
            String month,
            BigDecimal amount,
            int orderCount
    ) {}

    public record CategorySpendingDto(
            UUID categoryId,
            String categoryName,
            BigDecimal amount,
            double percentage
    ) {}

    public record FrequentProductDto(
            UUID productId,
            String title,
            String imageUrl,
            int purchaseCount,
            BigDecimal avgPrice
    ) {}
}
