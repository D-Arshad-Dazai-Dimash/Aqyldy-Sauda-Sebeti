package com.darshad.project.store;

import com.darshad.project.store.dto.InventoryResponse;
import com.darshad.project.store.dto.StoreResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class StoreService {

    private final StoreRepository storeRepository;
    private final InventoryRepository inventoryRepository;

    public List<StoreResponse> getAllActive() {
        return storeRepository.findAllByActiveTrue()
                .stream()
                .map(s -> new StoreResponse(
                        s.getId(),
                        s.getName(),
                        s.getAddress()
                ))
                .toList();
    }

    public StoreResponse getById(UUID id) {

        var store = storeRepository.findById(id)
                .orElseThrow(() -> new IllegalStateException("Store not found"));

        if (!store.isActive()) {
            throw new IllegalStateException("Store inactive");
        }

        return new StoreResponse(
                store.getId(),
                store.getName(),
                store.getAddress()
        );
    }

    public List<InventoryResponse> getStoreInventory(UUID storeId) {

        var store = storeRepository.findById(storeId)
                .orElseThrow(() -> new IllegalStateException("Store not found"));

        if (!store.isActive()) {
            throw new IllegalStateException("Store inactive");
        }

        return inventoryRepository.findByStore_Id(storeId)
                .stream()
                .map(inv -> new InventoryResponse(
                        inv.getProduct().getId(),
                        inv.getProduct().getTitle(),
                        inv.getProduct().getPrice(),
                        inv.getProduct().getImageUrl(),
                        inv.getQuantity()
                ))
                .toList();
    }

    public List<InventoryResponse> getStoreProducts(UUID storeId) {

        var store = storeRepository.findById(storeId)
                .orElseThrow(() -> new IllegalStateException("Store not found"));

        if (!store.isActive()) {
            throw new IllegalStateException("Store inactive");
        }

        return inventoryRepository.findByStore_Id(storeId)
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
    }
}