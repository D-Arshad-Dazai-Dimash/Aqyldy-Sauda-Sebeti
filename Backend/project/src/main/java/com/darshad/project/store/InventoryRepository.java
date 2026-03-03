package com.darshad.project.store;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;
import java.util.UUID;

public interface InventoryRepository extends JpaRepository<Inventory, InventoryId> {

    Optional<Inventory> findByStoreIdAndProductId(UUID storeId, UUID productId);

    // Spring Data сам поймёт, что store.id и product.id
    Optional<Inventory> findByStore_IdAndProduct_Id(UUID storeId, UUID productId);
}