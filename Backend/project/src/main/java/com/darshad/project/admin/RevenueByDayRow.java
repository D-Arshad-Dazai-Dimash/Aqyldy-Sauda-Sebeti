package com.darshad.project.admin;

import java.math.BigDecimal;
import java.time.LocalDate;

/** Projection used by OrderRepository.findRevenueByDay JPQL query. */
public class RevenueByDayRow {
    private final LocalDate date;
    private final BigDecimal revenue;

    public RevenueByDayRow(LocalDate date, BigDecimal revenue) {
        this.date = date;
        this.revenue = revenue;
    }

    public RevenueByDayRow(java.sql.Date date, BigDecimal revenue) {
        this.date = date.toLocalDate();
        this.revenue = revenue;
    }

    public LocalDate date() { return date; }
    public BigDecimal revenue() { return revenue; }
    public LocalDate getDate() { return date; }
    public BigDecimal getRevenue() { return revenue; }
}
