package com.darshad.project.admin;

import com.darshad.project.order.OrderRepository;
import com.darshad.project.store.Store;
import com.darshad.project.store.StoreRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
@DisplayName("StatsService — ТЗ-13")
class StatsServiceTest {

    @Mock OrderRepository orderRepo;
    @Mock StoreRepository storeRepo;

    @InjectMocks StatsService statsService;

    UUID storeId;
    Store store;
    LocalDate from, to;

    @BeforeEach
    void setUp() {
        storeId = UUID.randomUUID();
        store   = Store.builder().id(storeId).name("Stats Store").active(true).build();
        from    = LocalDate.of(2026, 1, 1);
        to      = LocalDate.of(2026, 4, 8);
    }

    @Test
    @DisplayName("getStats — возвращает корректную структуру")
    void getStats_returnsProperShape() {
        when(storeRepo.findById(storeId)).thenReturn(Optional.of(store));
        when(orderRepo.sumRevenueByStoreAndPeriod(eq(storeId), any(), any()))
                .thenReturn(BigDecimal.valueOf(125000));
        when(orderRepo.countOrdersByStoreAndPeriod(eq(storeId), any(), any()))
                .thenReturn(42L);
        when(orderRepo.findTopProductsByStore(eq(storeId), any(), any(), any()))
                .thenReturn(List.of(
                        new TopProductRow(UUID.randomUUID(), "Milk", 18L, BigDecimal.valueOf(27000))
                ));
        when(orderRepo.findRevenueByDay(eq(storeId), any(), any()))
                .thenReturn(List.of(
                        new RevenueByDayRow(LocalDate.of(2026, 4, 1), BigDecimal.valueOf(5400))
                ));

        StatsResponse stats = statsService.getStats(storeId, from, to);

        assertThat(stats.totalRevenue()).isEqualByComparingTo(BigDecimal.valueOf(125000));
        assertThat(stats.ordersCount()).isEqualTo(42L);
        assertThat(stats.topProducts()).hasSize(1);
        assertThat(stats.topProducts().get(0).title()).isEqualTo("Milk");
        assertThat(stats.revenueByDay()).hasSize(1);
        assertThat(stats.revenueByDay().get(0).revenue())
                .isEqualByComparingTo(BigDecimal.valueOf(5400));
    }

    @Test
    @DisplayName("getStats — бросает если магазин не найден")
    void getStats_throwsWhenStoreNotFound() {
        when(storeRepo.findById(storeId)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> statsService.getStats(storeId, from, to))
                .isInstanceOf(IllegalStateException.class)
                .hasMessageContaining("Store not found");
    }

    @Test
    @DisplayName("getStats — from не может быть позже to")
    void getStats_throwsWhenFromAfterTo() {
        assertThatThrownBy(() -> statsService.getStats(storeId, to, from))
                .isInstanceOf(IllegalArgumentException.class);
    }
}
