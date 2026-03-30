package com.darshad.project.store;

import com.darshad.project.store.dto.InventoryResponse;
import com.darshad.project.store.dto.StoreResponse;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class StoreService {

    private static final Logger log = LoggerFactory.getLogger(StoreService.class);

    private final StoreRepository storeRepository;
    private final InventoryRepository inventoryRepository;

    public List<StoreResponse> getAllActive() {
        log.debug("▶ getAllActive stores");
        var stores = storeRepository.findAllByActiveTrue()
                .stream()
                .map(this::toDto)
                .toList();
        log.debug("  found {} active stores", stores.size());
        return stores;
    }

    public StoreResponse getById(UUID id) {

        log.debug("▶ getById: storeId={}", id);

        var store = storeRepository.findById(id)
                .orElseThrow(() -> new IllegalStateException("Store not found"));

        if (!store.isActive()) {
            log.warn("  ✗ store inactive: id={}, name={}", id, store.getName());
            throw new IllegalStateException("Store inactive");
        }

        return toDto(store);
    }

    private StoreResponse toDto(Store s) {
        return new StoreResponse(
                s.getId(),
                s.getName(),
                s.getAddress(),
                s.getDescription(),
                s.getPhone(),
                s.getLogoUrl(),
                s.getWorkingHours()
        );
    }

    public List<InventoryResponse> getStoreInventory(UUID storeId) {

        log.debug("▶ getStoreInventory: storeId={}", storeId);

        var store = storeRepository.findById(storeId)
                .orElseThrow(() -> new IllegalStateException("Store not found"));

        if (!store.isActive()) {
            throw new IllegalStateException("Store inactive");
        }

        var items = inventoryRepository.findWithProductByStore_Id(storeId)
                .stream()
                .map(inv -> new InventoryResponse(
                        inv.getProduct().getId(),
                        inv.getProduct().getTitle(),
                        inv.getProduct().getPrice(),
                        inv.getProduct().getImageUrl(),
                        inv.getQuantity()
                ))
                .toList();
        log.debug("  store={}, inventory items={}", store.getName(), items.size());
        return items;
    }

    public List<InventoryResponse> getStoreProducts(UUID storeId) {

        log.debug("▶ getStoreProducts (available): storeId={}", storeId);

        var store = storeRepository.findById(storeId)
                .orElseThrow(() -> new IllegalStateException("Store not found"));

        if (!store.isActive()) {
            throw new IllegalStateException("Store inactive");
        }

        var items = inventoryRepository.findWithProductByStore_Id(storeId)
                .stream()
                .filter(inv -> inv.getQuantity() > 0)
                .map(inv -> new InventoryResponse(
                        inv.getProduct().getId(),
                        inv.getProduct().getTitle(),
                        inv.getProduct().getPrice(),
                        inv.getProduct().getImageUrl(),
                        inv.getQuantity()
                ))
                .toList();
        log.debug("  store={}, available products={}", store.getName(), items.size());
        return items;
    }
}