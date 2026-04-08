package com.darshad.project.admin;

import com.darshad.project.catalog.product.ProductRepository;
import com.darshad.project.store.InventoryId;
import com.darshad.project.store.InventoryRepository;
import com.darshad.project.store.StoreRepository;
import com.darshad.project.store.dto.Inventory;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class InventoryAdminService {

    private static final Logger log = LoggerFactory.getLogger(InventoryAdminService.class);

    private final InventoryRepository inventoryRepo;
    private final StoreRepository storeRepo;
    private final ProductRepository productRepo;

    /** ТЗ-12: list all inventory rows for a store. */
    @Transactional(readOnly = true)
    public List<InventoryItemResponse> getInventory(UUID storeId) {
        log.debug("▶ admin getInventory: storeId={}", storeId);
        storeRepo.findById(storeId)
                .orElseThrow(() -> new IllegalStateException("Store not found"));

        return inventoryRepo.findWithProductByStore_Id(storeId).stream()
                .map(inv -> new InventoryItemResponse(
                        inv.getProduct().getId(),
                        inv.getProduct().getTitle(),
                        inv.getProduct().getPrice(),
                        inv.getProduct().getImageUrl(),
                        inv.getQuantity()
                )).toList();
    }

    /**
     * ТЗ-12: create or update inventory quantity (absolute value, not delta).
     * Creates the row if it doesn't exist yet, updates quantity otherwise.
     */
    @Transactional
    public InventoryItemResponse upsertInventory(UUID storeId, UUID productId, int quantity) {
        log.info("▶ admin upsertInventory: storeId={}, productId={}, qty={}", storeId, productId, quantity);

        if (quantity < 0) {
            throw new IllegalArgumentException("quantity must be >= 0");
        }

        var store = storeRepo.findById(storeId)
                .orElseThrow(() -> new IllegalStateException("Store not found"));
        var product = productRepo.findById(productId)
                .orElseThrow(() -> new IllegalStateException("Product not found"));

        var inv = inventoryRepo.findByStore_IdAndProduct_Id(storeId, productId)
                .orElseGet(() -> Inventory.builder()
                        .id(new InventoryId(storeId, productId))
                        .store(store)
                        .product(product)
                        .quantity(0)
                        .build());

        inv.setQuantity(quantity);
        inventoryRepo.save(inv);

        log.info("✓ inventory upserted: store={}, product={}, qty={}",
                storeId, product.getTitle(), quantity);

        return new InventoryItemResponse(
                product.getId(), product.getTitle(),
                product.getPrice(), product.getImageUrl(), quantity
        );
    }
}
