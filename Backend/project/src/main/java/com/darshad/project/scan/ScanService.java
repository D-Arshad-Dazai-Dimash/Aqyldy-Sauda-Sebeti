package com.darshad.project.scan;

import com.darshad.project.catalog.product.ProductRepository;
import com.darshad.project.scan.dto.ScanRequest;
import com.darshad.project.scan.dto.ScanResponse;
import com.darshad.project.store.InventoryRepository;
import com.darshad.project.store.StoreRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class ScanService {

    private final ProductRepository productRepo;
    private final InventoryRepository inventoryRepo;
    private final StoreRepository storeRepo;

    public ScanResponse scan(ScanRequest request) {

        var store = storeRepo.findById(request.storeId())
                .orElseThrow(() -> new IllegalStateException("Store not found"));

        var product = productRepo.findByBarcode(request.barcode())
                .orElseThrow(() -> new IllegalStateException("Product not found"));

        var inventory = inventoryRepo
                .findByStore_IdAndProduct_Id(store.getId(), product.getId())
                .orElse(null);

        int quantity = 0;
        boolean available = false;

        if (inventory != null) {
            quantity = inventory.getQuantity();
            available = quantity > 0;
        }

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