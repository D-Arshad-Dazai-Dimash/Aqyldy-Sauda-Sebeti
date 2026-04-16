package com.darshad.project.recommendation;

import com.darshad.project.catalog.product.Product;
import com.darshad.project.catalog.product.ProductRepository;
import com.darshad.project.order.OrderItemRepository;
import com.darshad.project.recommendation.dto.RecommendedProductDto;
import com.darshad.project.user.User;
import com.darshad.project.user.UserRepository;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;

import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
@DisplayName("RecommendationService — AI рекомендации")
class RecommendationServiceTest {

    @Mock OrderItemRepository orderItemRepo;
    @Mock ProductRepository productRepo;
    @Mock UserRepository userRepo;

    @InjectMocks RecommendationService service;

    @Test
    @DisplayName("getFrequentlyBoughtTogether_returnsCoProducts")
    void getFrequentlyBoughtTogether_returnsCoProducts() {
        // Given
        UUID productId = UUID.randomUUID();
        UUID coProduct1 = UUID.randomUUID();
        UUID coProduct2 = UUID.randomUUID();
        List<UUID> ids = List.of(coProduct1, coProduct2);

        Product p1 = Product.builder().id(coProduct1).title("Product 1").price(BigDecimal.valueOf(100)).discount(BigDecimal.ZERO).imageUrl("img1").active(true).build();
        Product p2 = Product.builder().id(coProduct2).title("Product 2").price(BigDecimal.valueOf(200)).discount(BigDecimal.ZERO).imageUrl("img2").active(true).build();

        when(orderItemRepo.findFrequentlyBoughtTogetherIds(eq(productId), any(Pageable.class))).thenReturn(ids);
        when(productRepo.findAllById(ids)).thenReturn(List.of(p1, p2));

        // When
        List<RecommendedProductDto> result = service.frequentlyBoughtTogether(productId, 10);

        // Then
        assertThat(result).hasSize(2);
        assertThat(result.get(0).id()).isEqualTo(coProduct1);
        assertThat(result.get(0).score()).isEqualTo(1.0);
        assertThat(result.get(1).id()).isEqualTo(coProduct2);
        assertThat(result.get(1).score()).isEqualTo(0.5);
    }

    @Test
    @DisplayName("getFrequentlyBoughtTogether_excludesSourceProduct")
    void getFrequentlyBoughtTogether_excludesSourceProduct() {
        // Given
        UUID productId = UUID.randomUUID();
        List<UUID> ids = List.of(); // No co-products

        when(orderItemRepo.findFrequentlyBoughtTogetherIds(eq(productId), any(Pageable.class))).thenReturn(ids);

        // When
        List<RecommendedProductDto> result = service.frequentlyBoughtTogether(productId, 10);

        // Then
        assertThat(result).isEmpty();
    }

    @Test
    @DisplayName("getFrequentlyBoughtTogether_emptyWhenNoOrders")
    void getFrequentlyBoughtTogether_emptyWhenNoOrders() {
        // Given
        UUID productId = UUID.randomUUID();
        List<UUID> ids = List.of();

        when(orderItemRepo.findFrequentlyBoughtTogetherIds(eq(productId), any(Pageable.class))).thenReturn(ids);

        // When
        List<RecommendedProductDto> result = service.frequentlyBoughtTogether(productId, 10);

        // Then
        assertThat(result).isEmpty();
    }

    @Test
    @DisplayName("getPersonalized_returnsProductsFromSimilarUsers")
    void getPersonalized_returnsProductsFromSimilarUsers() {
        // Given
        String email = "user@example.com";
        UUID userId = UUID.randomUUID();
        UUID recProduct = UUID.randomUUID();
        List<UUID> ids = List.of(recProduct);

        User user = User.builder().id(userId).email(email).build();
        Product p = Product.builder().id(recProduct).title("Recommended").price(BigDecimal.valueOf(150)).discount(BigDecimal.ZERO).imageUrl("img").active(true).build();

        when(userRepo.findByEmail(email)).thenReturn(Optional.of(user));
        when(orderItemRepo.findPersonalizedRecommendationIds(eq(userId), any(Pageable.class))).thenReturn(ids);
        when(productRepo.findAllById(ids)).thenReturn(List.of(p));

        // When
        List<RecommendedProductDto> result = service.personalizedForUser(email, 10);

        // Then
        assertThat(result).hasSize(1);
        assertThat(result.get(0).id()).isEqualTo(recProduct);
    }

    @Test
    @DisplayName("getPersonalized_fallsBackToPopular")
    void getPersonalized_fallsBackToPopular() {
        // Given
        String email = "newuser@example.com";
        UUID userId = UUID.randomUUID();
        List<UUID> personalizedIds = List.of(); // Empty
        UUID popularProduct = UUID.randomUUID();
        List<UUID> popularIds = List.of(popularProduct);

        User user = User.builder().id(userId).email(email).build();
        Product p = Product.builder().id(popularProduct).title("Popular").price(BigDecimal.valueOf(100)).discount(BigDecimal.ZERO).imageUrl("img").active(true).build();

        when(userRepo.findByEmail(email)).thenReturn(Optional.of(user));
        when(orderItemRepo.findPersonalizedRecommendationIds(eq(userId), any(Pageable.class))).thenReturn(personalizedIds);
        when(orderItemRepo.findPopularProductIds(any(Pageable.class))).thenReturn(popularIds);
        when(productRepo.findAllById(popularIds)).thenReturn(List.of(p));

        // When
        List<RecommendedProductDto> result = service.personalizedForUser(email, 10);

        // Then
        assertThat(result).hasSize(1);
        assertThat(result.get(0).id()).isEqualTo(popularProduct);
        verify(orderItemRepo).findPopularProductIds(any(Pageable.class));
    }

    @Test
    @DisplayName("getPopularProducts_returnsByFrequency")
    void getPopularProducts_returnsByFrequency() {
        // Given
        UUID product1 = UUID.randomUUID();
        UUID product2 = UUID.randomUUID();
        List<UUID> ids = List.of(product1, product2);

        Product p1 = Product.builder().id(product1).title("Frequent").price(BigDecimal.valueOf(100)).discount(BigDecimal.ZERO).imageUrl("img1").active(true).build();
        Product p2 = Product.builder().id(product2).title("Less Frequent").price(BigDecimal.valueOf(200)).discount(BigDecimal.ZERO).imageUrl("img2").active(true).build();

        when(orderItemRepo.findPopularProductIds(any(Pageable.class))).thenReturn(ids);
        when(productRepo.findAllById(ids)).thenReturn(List.of(p1, p2));

        // When
        List<RecommendedProductDto> result = service.popularProducts(10);

        // Then
        assertThat(result).hasSize(2);
        assertThat(result.get(0).id()).isEqualTo(product1);
        assertThat(result.get(1).id()).isEqualTo(product2);
    }

    @Test
    @DisplayName("getPopularProducts_excludesInactiveProducts")
    void getPopularProducts_excludesInactiveProducts() {
        // Given
        UUID activeProduct = UUID.randomUUID();
        UUID inactiveProduct = UUID.randomUUID();
        List<UUID> ids = List.of(activeProduct); // Only active returned from query

        Product p = Product.builder().id(activeProduct).title("Active").price(BigDecimal.valueOf(100)).discount(BigDecimal.ZERO).imageUrl("img").active(true).build();

        when(orderItemRepo.findPopularProductIds(any(Pageable.class))).thenReturn(ids);
        when(productRepo.findAllById(ids)).thenReturn(List.of(p));

        // When
        List<RecommendedProductDto> result = service.popularProducts(10);

        // Then
        assertThat(result).hasSize(1);
        assertThat(result.get(0).active()).isTrue();
    }
}