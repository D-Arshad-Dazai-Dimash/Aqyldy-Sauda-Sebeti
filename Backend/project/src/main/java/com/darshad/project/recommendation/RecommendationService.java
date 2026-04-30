package com.darshad.project.recommendation;

import com.darshad.project.catalog.product.Product;
import com.darshad.project.catalog.product.ProductRepository;
import com.darshad.project.order.OrderItemRepository;
import com.darshad.project.recommendation.dto.RecommendedProductDto;
import com.darshad.project.user.User;
import com.darshad.project.user.UserRepository;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.stream.IntStream;

/**
 * Item-based collaborative filtering recommendation engine.
 *
 * Strategies (applied in order with fallback):
 * 1. Frequently Bought Together — co-purchase analysis from order history
 * 2. Personalized — collaborative filtering based on similar users' purchases
 * 3. Popular — global bestsellers (cold-start fallback)
 */
@Service
@RequiredArgsConstructor
public class RecommendationService {

    private static final Logger log = LoggerFactory.getLogger(RecommendationService.class);
    private static final int DEFAULT_LIMIT = 10;

    private final OrderItemRepository orderItemRepo;
    private final ProductRepository productRepo;
    private final UserRepository userRepo;

    /**
     * Products frequently bought together with the given product.
     * Algorithm: find all orders containing productId → rank co-occurring products by frequency.
     */
    @Cacheable(value = "recommendations:together", key = "#productId + '_' + #limit")
    @Transactional(readOnly = true)
    public List<RecommendedProductDto> frequentlyBoughtTogether(UUID productId, int limit) {
        log.debug("▶ frequently-bought-together: productId={}, limit={}", productId, limit);

        var ids = orderItemRepo.findFrequentlyBoughtTogetherIds(
                productId, PageRequest.of(0, limit));

        var products = fetchProductsInOrder(ids);
        log.debug("  found {} co-purchased products", products.size());
        return toScoredDtos(products);
    }

    /**
     * Personalized recommendations for the authenticated user.
     * Algorithm: collaborative filtering — find users who bought similar products,
     * then recommend products those users bought that the current user hasn't.
     * Falls back to popular products for cold-start users.
     */
    @Transactional(readOnly = true)
    public List<RecommendedProductDto> personalizedForUser(String email, int limit) {
        log.debug("▶ personalized recommendations: email={}, limit={}", email, limit);

        var user = getUser(email);
        var ids = orderItemRepo.findPersonalizedRecommendationIds(
                user.getId(), PageRequest.of(0, limit));

        if (ids.isEmpty()) {
            log.debug("  no personalized results, falling back to popular");
            return popularProducts(limit, java.util.List.of());
        }

        var products = fetchProductsInOrder(ids);
        log.debug("  found {} personalized recommendations", products.size());
        return toScoredDtos(products);
    }

    /**
     * Globally popular products based on order frequency.
     * Used as cold-start fallback when user has no order history.
     */
    @Cacheable(value = "recommendations:popular", key = "'top' + #limit")
    @Transactional(readOnly = true)
    public List<RecommendedProductDto> popularProducts(int limit) {
        return popularProducts(limit, java.util.List.of());
    }

    /**
     * Globally popular products, excluding the given product IDs (used so
     * the "Popular" rail does not show duplicates from "Personal").
     */
    @Transactional(readOnly = true)
    public List<RecommendedProductDto> popularProducts(int limit, java.util.List<UUID> excludeIds) {
        log.debug("▶ popular products: limit={}, exclude={}", limit, excludeIds == null ? 0 : excludeIds.size());

        java.util.Set<UUID> excludeSet = excludeIds == null || excludeIds.isEmpty()
                ? java.util.Set.of()
                : new java.util.HashSet<>(excludeIds);

        // Pull more than needed so we still have `limit` items after filtering.
        int fetchSize = excludeSet.isEmpty() ? limit : Math.max(limit + excludeSet.size(), limit * 2);
        var ids = orderItemRepo.findPopularProductIds(PageRequest.of(0, fetchSize));
        if (!excludeSet.isEmpty()) {
            ids = ids.stream().filter(id -> !excludeSet.contains(id)).toList();
        }
        if (ids.size() > limit) {
            ids = ids.subList(0, limit);
        }
        var products = fetchProductsInOrder(ids);
        log.debug("  found {} popular products (after exclude)", products.size());
        return toScoredDtos(products);
    }

    // ───── helpers ─────

    private List<Product> fetchProductsInOrder(List<UUID> ids) {
        if (ids.isEmpty()) return List.of();

        Map<UUID, Product> map = new java.util.LinkedHashMap<>();
        productRepo.findAllById(ids).forEach(p -> map.put(p.getId(), p));

        // preserve the ranking order from the query
        return ids.stream()
                .filter(map::containsKey)
                .map(map::get)
                .toList();
    }

    private List<RecommendedProductDto> toScoredDtos(List<Product> products) {
        int total = products.size();
        return IntStream.range(0, total)
                .mapToObj(i -> {
                    var p = products.get(i);
                    // score: 1.0 for rank 1, decaying linearly
                    double score = total > 1
                            ? 1.0 - ((double) i / (total - 1)) * 0.5
                            : 1.0;
                    return new RecommendedProductDto(
                            p.getId(),
                            p.getTitle(),
                            p.getPrice(),
                            p.getDiscount(),
                            p.getImageUrl(),
                            p.isActive(),
                            Math.round(score * 100.0) / 100.0
                    );
                })
                .toList();
    }

    private User getUser(String email) {
        return userRepo.findByEmail(email)
                .orElseThrow(() -> new IllegalStateException("User not found"));
    }
}
