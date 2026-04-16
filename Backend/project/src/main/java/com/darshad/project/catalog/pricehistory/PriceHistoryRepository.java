package com.darshad.project.catalog.pricehistory;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.math.BigDecimal;
import java.util.List;
import java.util.UUID;

public interface PriceHistoryRepository extends JpaRepository<PriceHistory, UUID> {

    List<PriceHistory> findByProductIdOrderByChangedAtDesc(UUID productId);

    // ───── Price Insights: aggregate statistics ─────

    @Query("SELECT AVG(ph.newPrice) FROM PriceHistory ph WHERE ph.product.id = :pid")
    BigDecimal findAveragePrice(@Param("pid") UUID productId);

    @Query("SELECT MIN(ph.newPrice) FROM PriceHistory ph WHERE ph.product.id = :pid")
    BigDecimal findLowestPrice(@Param("pid") UUID productId);

    @Query("SELECT MAX(ph.newPrice) FROM PriceHistory ph WHERE ph.product.id = :pid")
    BigDecimal findHighestPrice(@Param("pid") UUID productId);

    long countByProductId(UUID productId);
}
