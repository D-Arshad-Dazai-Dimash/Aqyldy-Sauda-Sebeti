package com.darshad.project.store;

import com.darshad.project.store.dto.Inventory;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface InventoryRepository extends JpaRepository<Inventory, InventoryId> {

    Optional<Inventory> findByStore_IdAndProduct_Id(UUID storeId, UUID productId);

    List<Inventory> findByStore_Id(UUID storeId);
}