package com.darshad.project.order;

import com.darshad.project.admin.RevenueByDayRow;
import com.darshad.project.admin.TopProductRow;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface OrderRepository extends JpaRepository<Order, UUID> {

    List<Order> findByUserIdOrderByCreatedAtDesc(UUID userId);

    List<Order> findByUserIdAndStoreIdOrderByCreatedAtDesc(UUID userId, UUID storeId);

        @Query("SELECT o FROM Order o LEFT JOIN FETCH o.store LEFT JOIN FETCH o.items i LEFT JOIN FETCH i.product WHERE o.id = :orderId AND o.user.id = :userId")
    Optional<Order> findByIdAndUserIdWithItems(UUID orderId, UUID userId);

        @Query("SELECT o FROM Order o LEFT JOIN FETCH o.store LEFT JOIN FETCH o.items i LEFT JOIN FETCH i.product WHERE o.id = :orderId")
    Optional<Order> findByIdWithItems(UUID orderId);

    /**
     * ТЗ-11: paginated orders for a merchant's stores, optionally filtered by status.
     * When {@code status} is null all statuses are included.
     */
    @Query("""
            SELECT o FROM Order o
            WHERE o.store.id IN :storeIds
              AND (:status IS NULL OR o.status = :status)
            ORDER BY o.createdAt DESC
            """)
    org.springframework.data.domain.Page<Order> findByStoreIdInAndStatusOptional(
            @Param("storeIds") java.util.List<UUID> storeIds,
            @Param("status") OrderStatus status,
            org.springframework.data.domain.Pageable pageable);

    /** ТЗ-13: sum of order totals for a store within a date range. */
    @Query("""
            SELECT COALESCE(SUM(o.totalAmount), 0)
            FROM Order o
            WHERE o.store.id = :storeId
              AND CAST(o.createdAt AS date) BETWEEN :from AND :to
              AND o.status <> com.darshad.project.order.OrderStatus.CANCELLED
            """)
    BigDecimal sumRevenueByStoreAndPeriod(
            @Param("storeId") UUID storeId,
            @Param("from") LocalDate from,
            @Param("to") LocalDate to);

    /** ТЗ-13: count of orders for a store within a date range. */
    @Query("""
            SELECT COUNT(o)
            FROM Order o
            WHERE o.store.id = :storeId
              AND CAST(o.createdAt AS date) BETWEEN :from AND :to
              AND o.status <> com.darshad.project.order.OrderStatus.CANCELLED
            """)
    Long countOrdersByStoreAndPeriod(
            @Param("storeId") UUID storeId,
            @Param("from") LocalDate from,
            @Param("to") LocalDate to);

    /** ТЗ-13: top-N products by quantity sold for a store. */
    @Query("""
            SELECT new com.darshad.project.admin.TopProductRow(
                i.product.id,
                i.product.title,
                SUM(i.quantity),
                SUM(i.price * i.quantity)
            )
            FROM OrderItem i
            WHERE i.order.store.id = :storeId
              AND CAST(i.order.createdAt AS date) BETWEEN :from AND :to
              AND i.order.status <> com.darshad.project.order.OrderStatus.CANCELLED
            GROUP BY i.product.id, i.product.title
            ORDER BY SUM(i.quantity) DESC
            """)
    List<TopProductRow> findTopProductsByStore(
            @Param("storeId") UUID storeId,
            @Param("from") LocalDate from,
            @Param("to") LocalDate to,
            Pageable pageable);

    /** ТЗ-13: daily revenue breakdown for a store. */
    @Query("""
            SELECT new com.darshad.project.admin.RevenueByDayRow(
                CAST(o.createdAt AS date),
                SUM(o.totalAmount)
            )
            FROM Order o
            WHERE o.store.id = :storeId
              AND CAST(o.createdAt AS date) BETWEEN :from AND :to
              AND o.status <> com.darshad.project.order.OrderStatus.CANCELLED
            GROUP BY CAST(o.createdAt AS date)
            ORDER BY CAST(o.createdAt AS date)
            """)
    List<RevenueByDayRow> findRevenueByDay(
            @Param("storeId") UUID storeId,
            @Param("from") LocalDate from,
            @Param("to") LocalDate to);
}