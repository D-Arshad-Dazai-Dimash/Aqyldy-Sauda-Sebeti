package com.darshad.project.analytics;

import com.darshad.project.analytics.dto.SpendingAnalyticsDto;
import com.darshad.project.order.OrderItemRepository;
import com.darshad.project.order.OrderRepository;
import com.darshad.project.user.User;
import com.darshad.project.user.UserRepository;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.util.Arrays;

import static org.assertj.core.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
@DisplayName("AnalyticsService — Аналитика расходов")
class AnalyticsServiceTest {

    @Mock OrderRepository orderRepo;
    @Mock OrderItemRepository orderItemRepo;
    @Mock UserRepository userRepo;

    @InjectMocks AnalyticsService service;

    @Test
    @DisplayName("getAnalytics_returnsTotalAndAverage")
    void getAnalytics_returnsTotalAndAverage() {
        // Given
        String email = "user@example.com";
        UUID userId = UUID.randomUUID();
        User user = User.builder().id(userId).email(email).build();

        // Mock monthly spending: 2 months, 1000 + 2000 = 3000 total, 2 orders
        List<Object[]> monthlyData = Arrays.asList(
                new Object[]{2024, 1, BigDecimal.valueOf(1000), 1L},
                new Object[]{2024, 2, BigDecimal.valueOf(2000), 1L}
        );

        when(userRepo.findByEmail(email)).thenReturn(Optional.of(user));
        when(orderItemRepo.findMonthlySpending(userId)).thenReturn(monthlyData);
        when(orderItemRepo.findCategorySpending(userId)).thenReturn(List.of());
        when(orderItemRepo.findFrequentlyPurchasedProducts(eq(userId), any())).thenReturn(List.of());

        // When
        SpendingAnalyticsDto result = service.getSpendingAnalytics(email);

        // Then
        assertThat(result.totalSpent()).isEqualByComparingTo("3000");
        assertThat(result.averageOrderAmount()).isEqualByComparingTo("1500"); // 3000 / 2
        assertThat(result.orderCount()).isEqualTo(2);
    }

    @Test
    @DisplayName("getAnalytics_categoryBreakdown")
    void getAnalytics_categoryBreakdown() {
        // Given
        String email = "user@example.com";
        UUID userId = UUID.randomUUID();
        User user = User.builder().id(userId).email(email).build();

        List<Object[]> monthlyData = List.of(
                new Object[]{2024, 1, BigDecimal.valueOf(3000), 3L} // 3 orders, total 3000
        );
        List<Object[]> categoryData = Arrays.asList(
                new Object[]{UUID.randomUUID(), "Dairy", BigDecimal.valueOf(2250)}, // 2250 / 3000 = 75%
                new Object[]{UUID.randomUUID(), "Snacks", BigDecimal.valueOf(750)}  // 750 / 3000 = 25%
        );

        when(userRepo.findByEmail(email)).thenReturn(Optional.of(user));
        when(orderItemRepo.findMonthlySpending(userId)).thenReturn(monthlyData);
        when(orderItemRepo.findCategorySpending(userId)).thenReturn(categoryData);
        when(orderItemRepo.findFrequentlyPurchasedProducts(eq(userId), any())).thenReturn(List.of());

        // When
        SpendingAnalyticsDto result = service.getSpendingAnalytics(email);

        // Then
        assertThat(result.categoryBreakdown()).hasSize(2);
        assertThat(result.categoryBreakdown().get(0).categoryName()).isEqualTo("Dairy");
        assertThat(result.categoryBreakdown().get(0).percentage()).isEqualTo(75.0);
        assertThat(result.categoryBreakdown().get(1).categoryName()).isEqualTo("Snacks");
        assertThat(result.categoryBreakdown().get(1).percentage()).isEqualTo(25.0);
    }

    @Test
    @DisplayName("getAnalytics_monthlyTrend")
    void getAnalytics_monthlyTrend() {
        // Given
        String email = "user@example.com";
        UUID userId = UUID.randomUUID();
        User user = User.builder().id(userId).email(email).build();

        List<Object[]> monthlyData = Arrays.asList(
                new Object[]{2024, 1, BigDecimal.valueOf(1000), 2L},
                new Object[]{2024, 2, BigDecimal.valueOf(2000), 1L},
                new Object[]{2024, 3, BigDecimal.valueOf(1500), 3L}
        );

        when(userRepo.findByEmail(email)).thenReturn(Optional.of(user));
        when(orderItemRepo.findMonthlySpending(userId)).thenReturn(monthlyData);
        when(orderItemRepo.findCategorySpending(userId)).thenReturn(List.of());
        when(orderItemRepo.findFrequentlyPurchasedProducts(eq(userId), any())).thenReturn(List.of());

        // When
        SpendingAnalyticsDto result = service.getSpendingAnalytics(email);

        // Then
        assertThat(result.monthlyTrend()).hasSize(3);
        assertThat(result.monthlyTrend().get(0).month()).isEqualTo("2024-01");
        assertThat(result.monthlyTrend().get(0).amount()).isEqualByComparingTo("1000");
        assertThat(result.monthlyTrend().get(0).orderCount()).isEqualTo(2);
        assertThat(result.monthlyTrend().get(1).month()).isEqualTo("2024-02");
        assertThat(result.monthlyTrend().get(2).month()).isEqualTo("2024-03");
    }

    @Test
    @DisplayName("predictNextMonth_linearTrendUp")
    void predictNextMonth_linearTrendUp() {
        // Given
        String email = "user@example.com";
        UUID userId = UUID.randomUUID();
        User user = User.builder().id(userId).email(email).build();

        // Data: [10000, 20000, 30000] → slope = 10000, prediction = 40000
        List<Object[]> monthlyData = Arrays.asList(
                new Object[]{2024, 1, BigDecimal.valueOf(10000), 1L},
                new Object[]{2024, 2, BigDecimal.valueOf(20000), 1L},
                new Object[]{2024, 3, BigDecimal.valueOf(30000), 1L}
        );

        when(userRepo.findByEmail(email)).thenReturn(Optional.of(user));
        when(orderItemRepo.findMonthlySpending(userId)).thenReturn(monthlyData);
        when(orderItemRepo.findCategorySpending(userId)).thenReturn(List.of());
        when(orderItemRepo.findFrequentlyPurchasedProducts(eq(userId), any())).thenReturn(List.of());

        // When
        SpendingAnalyticsDto result = service.getSpendingAnalytics(email);

        // Then
        assertThat(result.predictedNextMonthSpending()).isCloseTo(BigDecimal.valueOf(40000), within(BigDecimal.valueOf(500)));
    }

    @Test
    @DisplayName("predictNextMonth_linearTrendDown")
    void predictNextMonth_linearTrendDown() {
        // Given
        String email = "user@example.com";
        UUID userId = UUID.randomUUID();
        User user = User.builder().id(userId).email(email).build();

        // Data: [30000, 20000, 10000] → slope = -10000, prediction = 0 (max(0, 0))
        List<Object[]> monthlyData = Arrays.asList(
                new Object[]{2024, 1, BigDecimal.valueOf(30000), 1L},
                new Object[]{2024, 2, BigDecimal.valueOf(20000), 1L},
                new Object[]{2024, 3, BigDecimal.valueOf(10000), 1L}
        );

        when(userRepo.findByEmail(email)).thenReturn(Optional.of(user));
        when(orderItemRepo.findMonthlySpending(userId)).thenReturn(monthlyData);
        when(orderItemRepo.findCategorySpending(userId)).thenReturn(List.of());
        when(orderItemRepo.findFrequentlyPurchasedProducts(eq(userId), any())).thenReturn(List.of());

        // When
        SpendingAnalyticsDto result = service.getSpendingAnalytics(email);

        // Then
        assertThat(result.predictedNextMonthSpending()).isEqualByComparingTo("0");
    }

    @Test
    @DisplayName("predictNextMonth_flatTrend")
    void predictNextMonth_flatTrend() {
        // Given
        String email = "user@example.com";
        UUID userId = UUID.randomUUID();
        User user = User.builder().id(userId).email(email).build();

        // Data: [15000, 15000, 15000] → slope = 0, prediction = 15000
        List<Object[]> monthlyData = Arrays.asList(
                new Object[]{2024, 1, BigDecimal.valueOf(15000), 1L},
                new Object[]{2024, 2, BigDecimal.valueOf(15000), 1L},
                new Object[]{2024, 3, BigDecimal.valueOf(15000), 1L}
        );

        when(userRepo.findByEmail(email)).thenReturn(Optional.of(user));
        when(orderItemRepo.findMonthlySpending(userId)).thenReturn(monthlyData);
        when(orderItemRepo.findCategorySpending(userId)).thenReturn(List.of());
        when(orderItemRepo.findFrequentlyPurchasedProducts(eq(userId), any())).thenReturn(List.of());

        // When
        SpendingAnalyticsDto result = service.getSpendingAnalytics(email);

        // Then
        assertThat(result.predictedNextMonthSpending()).isEqualByComparingTo("15000");
    }

    @Test
    @DisplayName("predictNextMonth_singleMonth")
    void predictNextMonth_singleMonth() {
        // Given
        String email = "user@example.com";
        UUID userId = UUID.randomUUID();
        User user = User.builder().id(userId).email(email).build();

        // Only 1 month data → prediction = last month value
        List<Object[]> monthlyData = Arrays.asList(
                new Object[]{2024, 1, BigDecimal.valueOf(5000), 1L}
        );

        when(userRepo.findByEmail(email)).thenReturn(Optional.of(user));
        when(orderItemRepo.findMonthlySpending(userId)).thenReturn(monthlyData);
        when(orderItemRepo.findCategorySpending(userId)).thenReturn(List.of());
        when(orderItemRepo.findFrequentlyPurchasedProducts(eq(userId), any())).thenReturn(List.of());

        // When
        SpendingAnalyticsDto result = service.getSpendingAnalytics(email);

        // Then
        assertThat(result.predictedNextMonthSpending()).isEqualByComparingTo("0"); // Since n < 2, returns ZERO
    }
}