package com.darshad.project.admin;

import java.math.BigDecimal;
import java.util.List;

public record StatsResponse(
        BigDecimal totalRevenue,
        Long ordersCount,
        List<TopProductRow> topProducts,
        List<RevenueByDayRow> revenueByDay
) {}
