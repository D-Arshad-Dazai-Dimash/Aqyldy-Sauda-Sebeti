package com.darshad.project.store;

import com.darshad.project.store.dto.InventoryResponse;
import com.darshad.project.store.dto.StoreResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/stores")
@RequiredArgsConstructor
public class StoreController {

    private final StoreService storeService;

    @GetMapping
    public List<StoreResponse> getAll() {
        return storeService.getAllActive();
    }

    @GetMapping("/{id}")
    public StoreResponse getById(@PathVariable UUID id) {
        return storeService.getById(id);
    }

    @GetMapping("/{id}/inventory")
    public List<InventoryResponse> getInventory(@PathVariable UUID id) {
        return storeService.getStoreInventory(id);
    }

    @GetMapping("/{id}/products")
    public List<InventoryResponse> getProducts(@PathVariable UUID id) {
        return storeService.getStoreProducts(id);
    }
}