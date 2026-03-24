package com.darshad.project.scan;

import com.darshad.project.catalog.product.ProductRepository;
import com.darshad.project.scan.dto.ScanRequest;
import com.darshad.project.scan.dto.ScanResponse;
import com.darshad.project.store.InventoryRepository;
import com.darshad.project.store.StoreRepository;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class ScanService {

    private static final Logger log = LoggerFactory.getLogger(ScanService.class);

    private final ProductRepository productRepo;
    private final InventoryRepository inventoryRepo;
    private final StoreRepository storeRepo;

    public ScanResponse scan(ScanRequest request) {

        log.info("▶ SCAN: barcode={}, storeId={}", request.barcode(), request.storeId());

        var store = storeRepo.findById(request.storeId())
                .orElseThrow(() -> {
                    log.warn("  ✗ store not found: {}", request.storeId());
                    return new IllegalStateException("Store not found");
                });

        var product = productRepo.findByBarcode(request.barcode())
                .orElseThrow(() -> {
                    log.warn("  ✗ product not found for barcode: {}", request.barcode());
                    return new IllegalStateException("Product not found");
                });

        var inventory = inventoryRepo
                .findByStore_IdAndProduct_Id(store.getId(), product.getId())
                .orElse(null);

        int quantity = 0;
        boolean available = false;

        if (inventory != null) {
            quantity = inventory.getQuantity();
            available = quantity > 0;
        }

        log.info("  ✓ SCAN result: product={}, price={}, available={}, qty={}",
                product.getTitle(), product.getPrice(), available, quantity);

        return new ScanResponse(
                product.getId(),
                product.getTitle(),
                product.getDescription(),
                product.getPrice(),
                product.getImageUrl(),
                product.getBarcode(),
                quantity,
                available,
                store.getId(),
                store.getName()
        );
    }
}