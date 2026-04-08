package com.darshad.project.admin;

import com.darshad.project.order.OrderRepository;
import com.darshad.project.store.StoreRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class StatsService {

    private final OrderRepository orderRepo;
    private final StoreRepository storeRepo;

    /** ТЗ-13: revenue + order count + top products + daily breakdown. */
    @Transactional(readOnly = true)
    public StatsResponse getStats(UUID storeId, LocalDate from, LocalDate to) {
        if (from.isAfter(to)) {
            throw new IllegalArgumentException("'from' must not be after 'to'");
        }
        storeRepo.findById(storeId)
                .orElseThrow(() -> new IllegalStateException("Store not found"));

        BigDecimal totalRevenue = orderRepo.sumRevenueByStoreAndPeriod(storeId, from, to);
        if (totalRevenue == null) totalRevenue = BigDecimal.ZERO;

        Long ordersCount = orderRepo.countOrdersByStoreAndPeriod(storeId, from, to);
        if (ordersCount == null) ordersCount = 0L;

        List<TopProductRow> topProducts = orderRepo.findTopProductsByStore(
                storeId, from, to, PageRequest.of(0, 10));

        List<RevenueByDayRow> revenueByDay = orderRepo.findRevenueByDay(storeId, from, to);

        return new StatsResponse(totalRevenue, ordersCount, topProducts, revenueByDay);
    }
}
