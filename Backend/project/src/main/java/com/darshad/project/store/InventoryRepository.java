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
}