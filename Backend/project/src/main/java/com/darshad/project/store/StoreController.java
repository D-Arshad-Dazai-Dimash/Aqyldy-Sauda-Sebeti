package com.darshad.project.store;

import com.darshad.project.store.dto.InventoryResponse;
import com.darshad.project.store.dto.StoreResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

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

    @GetMapping("/{id}/products/page")
    public Page<InventoryResponse> getProductsPaged(
            @PathVariable UUID id,
            @RequestParam(required = false) String q,
            @RequestParam(defaultValue = "false") boolean inStock,
            @RequestParam(defaultValue = "titleAsc") String sort,
            Pageable pageable
    ) {
        return storeService.getStoreProductsPaged(id, q, inStock, sort, pageable);
    }

    /** ТЗ-14: returns stores owned by the current authenticated merchant. */
    @GetMapping("/my")
    public List<StoreResponse> getMyStores(Authentication auth) {
        return storeService.getMyStores(auth.getName());
    }

    /** Nearby stores filtered by Haversine distance. */
    @GetMapping("/nearby")
    public List<StoreResponse> getNearby(
            @RequestParam double lat,
            @RequestParam double lng,
            @RequestParam(defaultValue = "5000") double radiusMeters
    ) {
        return storeService.getNearby(lat, lng, radiusMeters);
    }
}
