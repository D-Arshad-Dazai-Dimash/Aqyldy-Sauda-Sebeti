package com.darshad.project.order;

import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.UUID;

public interface OrderItemRepository extends JpaRepository<OrderItem, UUID> {

    // ───── Recommendation: frequently bought together ─────
    @Query("""
            SELECT oi.product.id FROM OrderItem oi
            WHERE oi.order.id IN (
                SELECT oi2.order.id FROM OrderItem oi2
                WHERE oi2.product.id = :productId
                  AND oi2.order.status <> com.darshad.project.order.OrderStatus.CANCELLED
            )
            AND oi.product.id <> :productId
            AND oi.product.active = true
            GROUP BY oi.product.id
            ORDER BY COUNT(DISTINCT oi.order.id) DESC
            """)
    List<UUID> findFrequentlyBoughtTogetherIds(@Param("productId") UUID productId, Pageable pageable);

    // ───── Recommendation: personalized (collaborative filtering) ─────
    @Query("""
            SELECT oi.product.id FROM OrderItem oi
            WHERE oi.order.user.id IN (
                SELECT DISTINCT oi3.order.user.id FROM OrderItem oi3
                WHERE oi3.product.id IN (
                    SELECT DISTINCT oi4.product.id FROM OrderItem oi4
                    WHERE oi4.order.user.id = :userId
                      AND oi4.order.status <> com.darshad.project.order.OrderStatus.CANCELLED
                )
                AND oi3.order.user.id <> :userId
                AND oi3.order.status <> com.darshad.project.order.OrderStatus.CANCELLED
            )
            AND oi.product.id NOT IN (
                SELECT DISTINCT oi5.product.id FROM OrderItem oi5
                WHERE oi5.order.user.id = :userId
            )
            AND oi.product.active = true
            AND oi.order.status <> com.darshad.project.order.OrderStatus.CANCELLED
            GROUP BY oi.product.id
            ORDER BY COUNT(DISTINCT oi.order.id) DESC
            """)
    List<UUID> findPersonalizedRecommendationIds(@Param("userId") UUID userId, Pageable pageable);

    // ───── Recommendation: popular products (cold-start fallback) ─────
    @Query("""
            SELECT oi.product.id FROM OrderItem oi
            WHERE oi.order.status <> com.darshad.project.order.OrderStatus.CANCELLED
              AND oi.product.active = true
            GROUP BY oi.product.id
            ORDER BY COUNT(DISTINCT oi.order.id) DESC
            """)
    List<UUID> findPopularProductIds(Pageable pageable);

    // ───── Analytics: monthly spending ─────
    @Query("""
            SELECT EXTRACT(YEAR FROM o.createdAt),
                   EXTRACT(MONTH FROM o.createdAt),
                   SUM(o.totalAmount),
                   COUNT(o)
            FROM Order o
            WHERE o.user.id = :userId
              AND o.status <> com.darshad.project.order.OrderStatus.CANCELLED
            GROUP BY EXTRACT(YEAR FROM o.createdAt), EXTRACT(MONTH FROM o.createdAt)
            ORDER BY EXTRACT(YEAR FROM o.createdAt), EXTRACT(MONTH FROM o.createdAt)
            """)
    List<Object[]> findMonthlySpending(@Param("userId") UUID userId);

    // ───── Analytics: category breakdown ─────
    @Query("""
            SELECT c.id, c.name, SUM(oi.lineTotal)
            FROM OrderItem oi
            JOIN oi.product p
            JOIN p.categories c
            WHERE oi.order.user.id = :userId
              AND oi.order.status <> com.darshad.project.order.OrderStatus.CANCELLED
            GROUP BY c.id, c.name
            ORDER BY SUM(oi.lineTotal) DESC
            """)
    List<Object[]> findCategorySpending(@Param("userId") UUID userId);

    // ───── Analytics: frequently purchased products ─────
    @Query("""
            SELECT oi.product.id, oi.product.title, oi.product.imageUrl,
                   COUNT(DISTINCT oi.order.id), AVG(oi.price)
            FROM OrderItem oi
            WHERE oi.order.user.id = :userId
              AND oi.order.status <> com.darshad.project.order.OrderStatus.CANCELLED
            GROUP BY oi.product.id, oi.product.title, oi.product.imageUrl
            HAVING COUNT(DISTINCT oi.order.id) > 1
            ORDER BY COUNT(DISTINCT oi.order.id) DESC
            """)
    List<Object[]> findFrequentlyPurchasedProducts(@Param("userId") UUID userId, Pageable pageable);
}