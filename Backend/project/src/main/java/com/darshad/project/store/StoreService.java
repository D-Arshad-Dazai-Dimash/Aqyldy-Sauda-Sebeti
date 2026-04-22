package com.darshad.project.store;

import com.darshad.project.store.dto.InventoryResponse;
import com.darshad.project.store.dto.StoreResponse;
import com.darshad.project.user.UserRepository;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Locale;
import java.util.Comparator;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class StoreService {

    private static final Logger log = LoggerFactory.getLogger(StoreService.class);

    private final StoreRepository storeRepository;
    private final InventoryRepository inventoryRepository;
    private final UserRepository userRepository;

    /**
     * ТЗ-14: returns all stores owned by the currently authenticated merchant.
     */
    public List<StoreResponse> getMyStores(String email) {
        log.debug("▶ getMyStores: email={}", email);
        var user = userRepository.findByEmail(email)
                .orElseThrow(() -> new IllegalStateException("User not found"));
        var stores = storeRepository.findByOwnerId(user.getId())
                .stream().map(this::toDto).toList();
        log.debug("  found {} stores for owner={}", stores.size(), email);
        return stores;
    }

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

        public Page<InventoryResponse> getStoreProductsPaged(
                        UUID storeId,
                        String query,
                        boolean inStock,
                        String sort,
                        Pageable pageable
        ) {
                var store = storeRepository.findById(storeId)
                                .orElseThrow(() -> new IllegalStateException("Store not found"));

                if (!store.isActive()) {
                        throw new IllegalStateException("Store inactive");
                }

                String normalizedQuery = query == null ? "" : query.trim().toLowerCase(Locale.ROOT);

                List<InventoryResponse> filtered = inventoryRepository.findWithProductByStore_Id(storeId)
                                .stream()
                                .filter(inv -> !inStock || inv.getQuantity() > 0)
                                .filter(inv -> normalizedQuery.isEmpty() || inv.getProduct().getTitle().toLowerCase(Locale.ROOT).contains(normalizedQuery))
                                .map(inv -> new InventoryResponse(
                                                inv.getProduct().getId(),
                                                inv.getProduct().getTitle(),
                                                inv.getProduct().getPrice(),
                                                inv.getProduct().getImageUrl(),
                                                inv.getQuantity()
                                ))
                                .sorted(resolveSort(sort))
                                .toList();

                int total = filtered.size();
                int start = (int) pageable.getOffset();
                int end = Math.min(start + pageable.getPageSize(), total);
                List<InventoryResponse> content = start >= total ? List.of() : filtered.subList(start, end);

                return new PageImpl<>(content, pageable, total);
        }

        private Comparator<InventoryResponse> resolveSort(String sort) {
                if ("priceAsc".equalsIgnoreCase(sort)) {
                        return Comparator.comparing(InventoryResponse::price);
                }
                if ("priceDesc".equalsIgnoreCase(sort)) {
                        return Comparator.comparing(InventoryResponse::price).reversed();
                }
                return Comparator.comparing(item -> item.productTitle() == null ? "" : item.productTitle(), String.CASE_INSENSITIVE_ORDER);
        }
}