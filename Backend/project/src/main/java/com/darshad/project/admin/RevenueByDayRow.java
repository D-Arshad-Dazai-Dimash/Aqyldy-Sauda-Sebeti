package com.darshad.project.admin;

import java.math.BigDecimal;
import java.time.LocalDate;

/** Projection used by OrderRepository.findRevenueByDay JPQL query. */
public record RevenueByDayRow(LocalDate date, BigDecimal revenue) {}
