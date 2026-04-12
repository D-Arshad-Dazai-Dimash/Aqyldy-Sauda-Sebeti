package com.darshad.project.admin;

import java.math.BigDecimal;
import java.util.UUID;

/** Projection used by OrderRepository.findTopProductsByStore JPQL query. */
public class TopProductRow {
    private final UUID productId;
    private final String title;
    private final Long soldQty;
    private final BigDecimal revenue;

    public TopProductRow(UUID productId, String title, Long soldQty, BigDecimal revenue) {
        this.productId = productId;
        this.title = title;
        this.soldQty = soldQty;
        this.revenue = revenue;
    }

    public UUID productId() { return productId; }
    public String title() { return title; }
    public Long soldQty() { return soldQty; }
    public BigDecimal revenue() { return revenue; }
    public UUID getProductId() { return productId; }
    public String getTitle() { return title; }
    public Long getSoldQty() { return soldQty; }
    public BigDecimal getRevenue() { return revenue; }
}
