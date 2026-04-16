package com.darshad.project.catalog.pricehistory;

import com.darshad.project.catalog.pricehistory.dto.PriceInsightDto;
import com.darshad.project.catalog.pricehistory.dto.PriceInsightDto.PricePointDto;
import com.darshad.project.catalog.product.Product;
import com.darshad.project.catalog.product.ProductRepository;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.List;
import java.util.UUID;

/**
 * Price insight engine: statistical analysis of product price history.
 *
 * Features:
 * - Historical price statistics (avg, min, max)
 * - Trend detection (UP / DOWN / STABLE)
 * - "Good deal" flagging when current price < historical average
 * - Price change percentage vs average
 */
@Service
@RequiredArgsConstructor
public class PriceInsightService {

    private static final Logger log = LoggerFactory.getLogger(PriceInsightService.class);

    private final PriceHistoryRepository priceHistoryRepo;
    private final ProductRepository productRepo;

    @Cacheable(value = "price-insights", key = "#productId")
    @Transactional(readOnly = true)
    public PriceInsightDto getInsight(UUID productId) {
        log.debug("▶ price insight: productId={}", productId);

        var product = productRepo.findById(productId)
                .orElseThrow(() -> new IllegalStateException("Product not found"));

        BigDecimal currentPrice = effectivePrice(product);
        var historyRecords = priceHistoryRepo.findByProductIdOrderByChangedAtDesc(productId);

        if (historyRecords.isEmpty()) {
            log.debug("  no price history, returning current-only insight");
            return new PriceInsightDto(
                    productId, currentPrice, currentPrice,
                    currentPrice, currentPrice,
                    0.0, "STABLE", false, List.of()
            );
        }

        BigDecimal avgPrice = priceHistoryRepo.findAveragePrice(productId);
        BigDecimal lowestPrice = priceHistoryRepo.findLowestPrice(productId);
        BigDecimal highestPrice = priceHistoryRepo.findHighestPrice(productId);

        // include current price in min/max bounds
        if (currentPrice.compareTo(lowestPrice) < 0) lowestPrice = currentPrice;
        if (currentPrice.compareTo(highestPrice) > 0) highestPrice = currentPrice;

        // change percentage: (current - avg) / avg × 100
        double changePct = avgPrice.compareTo(BigDecimal.ZERO) > 0
                ? currentPrice.subtract(avgPrice)
                        .divide(avgPrice, 4, RoundingMode.HALF_UP)
                        .multiply(BigDecimal.valueOf(100))
                        .doubleValue()
                : 0.0;
        changePct = Math.round(changePct * 10.0) / 10.0;

        // trend detection from recent price changes
        String trend = detectTrend(historyRecords);

        // good deal: current effective price below historical average
        boolean goodDeal = currentPrice.compareTo(avgPrice) < 0;

        // build price history points
        var history = historyRecords.stream()
                .map(ph -> new PricePointDto(ph.getNewPrice(), ph.getChangedAt()))
                .toList();

        log.debug("  avg={}, trend={}, goodDeal={}, changePct={}%", avgPrice, trend, goodDeal, changePct);
        return new PriceInsightDto(
                productId, currentPrice, avgPrice,
                lowestPrice, highestPrice,
                changePct, trend, goodDeal, history
        );
    }

    /**
     * Detects price trend from the last few price changes.
     * Compares the two most recent prices to determine direction.
     */
    private String detectTrend(List<PriceHistory> history) {
        if (history.size() < 2) return "STABLE";

        var latest = history.get(0);   // most recent change
        var previous = history.get(1); // previous change

        int cmp = latest.getNewPrice().compareTo(previous.getNewPrice());
        if (cmp > 0) return "UP";
        if (cmp < 0) return "DOWN";
        return "STABLE";
    }

    private BigDecimal effectivePrice(Product p) {
        BigDecimal price = p.getPrice();
        if (p.getDiscount() != null && p.getDiscount().compareTo(BigDecimal.ZERO) > 0) {
            BigDecimal multiplier = BigDecimal.ONE.subtract(
                    p.getDiscount().divide(BigDecimal.valueOf(100), 4, RoundingMode.HALF_UP)
            );
            price = price.multiply(multiplier).setScale(2, RoundingMode.HALF_UP);
        }
        return price;
    }
}
