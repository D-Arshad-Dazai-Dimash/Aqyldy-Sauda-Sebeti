package com.darshad.project.catalog.pricehistory;

import com.darshad.project.catalog.pricehistory.dto.PriceInsightDto;
import com.darshad.project.catalog.product.Product;
import com.darshad.project.catalog.product.ProductRepository;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.time.OffsetDateTime;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
@DisplayName("PriceInsightService — Анализ цен")
class PriceInsightServiceTest {

    @Mock PriceHistoryRepository priceHistoryRepo;
    @Mock ProductRepository productRepo;

    @InjectMocks PriceInsightService service;

    @Test
    @DisplayName("getInsight_calculatesAvgMinMax")
    void getInsight_calculatesAvgMinMax() {
        // Given
        UUID productId = UUID.randomUUID();
        Product product = Product.builder().id(productId).price(BigDecimal.valueOf(250)).discount(BigDecimal.ZERO).build();

        List<PriceHistory> history = List.of(
                PriceHistory.builder().newPrice(BigDecimal.valueOf(100)).build(),
                PriceHistory.builder().newPrice(BigDecimal.valueOf(200)).build(),
                PriceHistory.builder().newPrice(BigDecimal.valueOf(300)).build()
        );

        when(productRepo.findById(productId)).thenReturn(Optional.of(product));
        when(priceHistoryRepo.findByProductIdOrderByChangedAtDesc(productId)).thenReturn(history);
        when(priceHistoryRepo.findAveragePrice(productId)).thenReturn(BigDecimal.valueOf(200));
        when(priceHistoryRepo.findLowestPrice(productId)).thenReturn(BigDecimal.valueOf(100));
        when(priceHistoryRepo.findHighestPrice(productId)).thenReturn(BigDecimal.valueOf(300));

        // When
        PriceInsightDto result = service.getInsight(productId);

        // Then
        assertThat(result.averagePrice()).isEqualByComparingTo("200");
        assertThat(result.lowestPrice()).isEqualByComparingTo("100");
        assertThat(result.highestPrice()).isEqualByComparingTo("300");
        assertThat(result.currentPrice()).isEqualByComparingTo("250");
    }

    @Test
    @DisplayName("getInsight_goodDealWhenBelowAverage")
    void getInsight_goodDealWhenBelowAverage() {
        // Given
        UUID productId = UUID.randomUUID();
        Product product = Product.builder().id(productId).price(BigDecimal.valueOf(150)).discount(BigDecimal.ZERO).build();

        List<PriceHistory> history = List.of(
                PriceHistory.builder().newPrice(BigDecimal.valueOf(200)).build()
        );

        when(productRepo.findById(productId)).thenReturn(Optional.of(product));
        when(priceHistoryRepo.findByProductIdOrderByChangedAtDesc(productId)).thenReturn(history);
        when(priceHistoryRepo.findAveragePrice(productId)).thenReturn(BigDecimal.valueOf(200));
        when(priceHistoryRepo.findLowestPrice(productId)).thenReturn(BigDecimal.valueOf(200));
        when(priceHistoryRepo.findHighestPrice(productId)).thenReturn(BigDecimal.valueOf(200));

        // When
        PriceInsightDto result = service.getInsight(productId);

        // Then
        assertThat(result.goodDeal()).isTrue();
    }

    @Test
    @DisplayName("getInsight_notGoodDealWhenAboveAverage")
    void getInsight_notGoodDealWhenAboveAverage() {
        // Given
        UUID productId = UUID.randomUUID();
        Product product = Product.builder().id(productId).price(BigDecimal.valueOf(250)).discount(BigDecimal.ZERO).build();

        List<PriceHistory> history = List.of(
                PriceHistory.builder().newPrice(BigDecimal.valueOf(200)).build()
        );

        when(productRepo.findById(productId)).thenReturn(Optional.of(product));
        when(priceHistoryRepo.findByProductIdOrderByChangedAtDesc(productId)).thenReturn(history);
        when(priceHistoryRepo.findAveragePrice(productId)).thenReturn(BigDecimal.valueOf(200));
        when(priceHistoryRepo.findLowestPrice(productId)).thenReturn(BigDecimal.valueOf(200));
        when(priceHistoryRepo.findHighestPrice(productId)).thenReturn(BigDecimal.valueOf(200));

        // When
        PriceInsightDto result = service.getInsight(productId);

        // Then
        assertThat(result.goodDeal()).isFalse();
    }

    @Test
    @DisplayName("getInsight_trendDetection")
    void getInsight_trendDetection() {
        // Given
        UUID productId = UUID.randomUUID();
        Product product = Product.builder().id(productId).price(BigDecimal.valueOf(150)).discount(BigDecimal.ZERO).build();

        List<PriceHistory> history = List.of(
                PriceHistory.builder().newPrice(BigDecimal.valueOf(150)).changedAt(OffsetDateTime.now()).build(), // latest
                PriceHistory.builder().newPrice(BigDecimal.valueOf(100)).changedAt(OffsetDateTime.now().minusDays(1)).build()  // previous
        );

        when(productRepo.findById(productId)).thenReturn(Optional.of(product));
        when(priceHistoryRepo.findByProductIdOrderByChangedAtDesc(productId)).thenReturn(history);
        when(priceHistoryRepo.findAveragePrice(productId)).thenReturn(BigDecimal.valueOf(125));
        when(priceHistoryRepo.findLowestPrice(productId)).thenReturn(BigDecimal.valueOf(100));
        when(priceHistoryRepo.findHighestPrice(productId)).thenReturn(BigDecimal.valueOf(150));

        // When
        PriceInsightDto result = service.getInsight(productId);

        // Then
        assertThat(result.trend()).isEqualTo("UP");
    }

    @Test
    @DisplayName("getInsight_noHistoryReturnsCurrentOnly")
    void getInsight_noHistoryReturnsCurrentOnly() {
        // Given
        UUID productId = UUID.randomUUID();
        Product product = Product.builder().id(productId).price(BigDecimal.valueOf(100)).discount(BigDecimal.ZERO).build();

        when(productRepo.findById(productId)).thenReturn(Optional.of(product));
        when(priceHistoryRepo.findByProductIdOrderByChangedAtDesc(productId)).thenReturn(List.of());

        // When
        PriceInsightDto result = service.getInsight(productId);

        // Then
        assertThat(result.averagePrice()).isEqualByComparingTo("100");
        assertThat(result.lowestPrice()).isEqualByComparingTo("100");
        assertThat(result.highestPrice()).isEqualByComparingTo("100");
        assertThat(result.trend()).isEqualTo("STABLE");
        assertThat(result.goodDeal()).isFalse();
        assertThat(result.history()).isEmpty();
    }
}