package com.darshad.project.analytics;

import com.darshad.project.analytics.dto.SpendingAnalyticsDto;
import com.darshad.project.analytics.dto.SpendingAnalyticsDto.*;
import com.darshad.project.order.OrderItemRepository;
import com.darshad.project.order.OrderRepository;
import com.darshad.project.order.OrderStatus;
import com.darshad.project.user.User;
import com.darshad.project.user.UserRepository;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.List;
import java.util.UUID;

/**
 * Spending analytics engine with ML-based budget prediction.
 *
 * Features:
 * - Total / average spending
 * - Monthly spending trend
 * - Category-wise breakdown
 * - Purchase frequency detection
 * - Linear regression for next-month spending prediction
 */
@Service
@RequiredArgsConstructor
public class AnalyticsService {

    private static final Logger log = LoggerFactory.getLogger(AnalyticsService.class);

    private final OrderRepository orderRepo;
    private final OrderItemRepository orderItemRepo;
    private final UserRepository userRepo;

    @Transactional(readOnly = true)
    public SpendingAnalyticsDto getSpendingAnalytics(String email) {
        log.debug("▶ spending analytics: email={}", email);

        var user = getUser(email);
        var userId = user.getId();

        // 1. Monthly spending trend
        var monthlyTrend = buildMonthlyTrend(userId);

        // 2. Total and average
        BigDecimal totalSpent = BigDecimal.ZERO;
        int orderCount = 0;
        for (var m : monthlyTrend) {
            totalSpent = totalSpent.add(m.amount());
            orderCount += m.orderCount();
        }
        BigDecimal averageOrder = orderCount > 0
                ? totalSpent.divide(BigDecimal.valueOf(orderCount), 2, RoundingMode.HALF_UP)
                : BigDecimal.ZERO;

        // 3. Category breakdown
        var categoryBreakdown = buildCategoryBreakdown(userId, totalSpent);

        // 4. Frequently purchased products
        var frequentProducts = buildFrequentProducts(userId);

        // 5. ML prediction: linear regression on monthly data
        BigDecimal predicted = predictNextMonth(monthlyTrend);

        log.debug("  total={}, avg={}, months={}, categories={}, predicted={}",
                totalSpent, averageOrder, monthlyTrend.size(), categoryBreakdown.size(), predicted);

        return new SpendingAnalyticsDto(
                totalSpent,
                averageOrder,
                orderCount,
                monthlyTrend,
                categoryBreakdown,
                predicted,
                frequentProducts
        );
    }

    // ───── Monthly trend ─────

    private List<MonthlySpendingDto> buildMonthlyTrend(UUID userId) {
        return orderItemRepo.findMonthlySpending(userId)
                .stream()
                .map(row -> {
                    int year = ((Number) row[0]).intValue();
                    int month = ((Number) row[1]).intValue();
                    BigDecimal amount = (BigDecimal) row[2];
                    long count = (Long) row[3];
                    String label = year + "-" + String.format("%02d", month);
                    return new MonthlySpendingDto(label, amount, (int) count);
                })
                .toList();
    }

    // ───── Category breakdown ─────

    private List<CategorySpendingDto> buildCategoryBreakdown(UUID userId, BigDecimal totalSpent) {
        return orderItemRepo.findCategorySpending(userId)
                .stream()
                .map(row -> {
                    UUID catId = (UUID) row[0];
                    String catName = (String) row[1];
                    BigDecimal amount = (BigDecimal) row[2];
                    double pct = totalSpent.compareTo(BigDecimal.ZERO) > 0
                            ? amount.divide(totalSpent, 4, RoundingMode.HALF_UP)
                                    .multiply(BigDecimal.valueOf(100))
                                    .doubleValue()
                            : 0.0;
                    return new CategorySpendingDto(catId, catName, amount,
                            Math.round(pct * 10.0) / 10.0);
                })
                .toList();
    }

    // ───── Frequent products ─────

    private List<FrequentProductDto> buildFrequentProducts(UUID userId) {
        return orderItemRepo.findFrequentlyPurchasedProducts(userId, PageRequest.of(0, 10))
                .stream()
                .map(row -> new FrequentProductDto(
                        (UUID) row[0],
                        (String) row[1],
                        (String) row[2],
                        ((Long) row[3]).intValue(),
                        row[4] instanceof BigDecimal bd ? bd : BigDecimal.valueOf(((Number) row[4]).doubleValue())
                ))
                .toList();
    }

    // ───── ML: Linear regression prediction ─────

    /**
     * Simple least-squares linear regression on monthly spending data.
     * Predicts spending for the next month by fitting a line y = mx + b
     * to the historical trend and extrapolating one step ahead.
     */
    private BigDecimal predictNextMonth(List<MonthlySpendingDto> trend) {
        int n = trend.size();
        if (n < 2) return BigDecimal.ZERO;

        double sumX = 0, sumY = 0, sumXY = 0, sumX2 = 0;
        for (int i = 0; i < n; i++) {
            double x = i;
            double y = trend.get(i).amount().doubleValue();
            sumX += x;
            sumY += y;
            sumXY += x * y;
            sumX2 += x * x;
        }

        double denominator = n * sumX2 - sumX * sumX;
        if (denominator == 0) {
            return trend.get(n - 1).amount(); // flat if no variance
        }

        double slope = (n * sumXY - sumX * sumY) / denominator;
        double intercept = (sumY - slope * sumX) / n;
        double prediction = slope * n + intercept;

        return BigDecimal.valueOf(Math.max(0, prediction))
                .setScale(2, RoundingMode.HALF_UP);
    }

    private User getUser(String email) {
        return userRepo.findByEmail(email)
                .orElseThrow(() -> new IllegalStateException("User not found"));
    }
}
