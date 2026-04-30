package com.darshad.project.store;

import com.darshad.project.store.dto.Inventory;
import jakarta.persistence.LockModeType;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface InventoryRepository extends JpaRepository<Inventory, InventoryId> {

    Optional<Inventory> findByStore_IdAndProduct_Id(UUID storeId, UUID productId);

    List<Inventory> findByStore_Id(UUID storeId);

    /**
     * Fetches inventory with product eagerly loaded in a single query.
     * Avoids N+1 problem when mapping inventory → product fields.
     */
    @EntityGraph(attributePaths = {"product"})
    List<Inventory> findWithProductByStore_Id(UUID storeId);

    boolean existsByStore_OwnerIdAndProduct_Id(UUID ownerId, UUID productId);

    /**
     * Acquires a row-level write lock on the inventory row before reading it.
     * Prevents two concurrent checkouts from selling the same last unit
     * (oversell). Must be called inside a @Transactional boundary.
     */
    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("select i from Inventory i where i.store.id = :storeId and i.product.id = :productId")
    Optional<Inventory> findForUpdateByStore_IdAndProduct_Id(@Param("storeId") UUID storeId,
                                                             @Param("productId") UUID productId);

    /**
     * Returns all inventory rows that have stock for a given product, with
     * the store eagerly loaded. Used by the buyer-facing "this product is
     * not in your store — try one of these instead" flow when a barcode
     * scan fails because the active store has no inventory.
     */
    @Query("""
            select i from Inventory i
            join fetch i.store s
            where i.product.id = :productId
              and i.quantity > 0
              and s.active = true
            order by i.quantity desc
            """)
    List<Inventory> findInStockStoresByProduct_Id(@Param("productId") UUID productId);
}