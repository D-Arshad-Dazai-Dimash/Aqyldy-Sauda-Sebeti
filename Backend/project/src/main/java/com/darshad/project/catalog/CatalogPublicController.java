package com.darshad.project.catalog;

import com.darshad.project.catalog.category.CategoryDto;
import com.darshad.project.catalog.category.CategoryService;
import com.darshad.project.catalog.product.BatchRequest;
import com.darshad.project.catalog.product.ProductDto;
import com.darshad.project.catalog.product.ProductService;
import com.darshad.project.catalog.product.ProductStoreAvailabilityDto;
import com.darshad.project.store.InventoryRepository;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;
import org.springframework.data.web.PageableDefault;
import org.springframework.data.domain.Sort;

@RestController
@RequestMapping("/api")
@RequiredArgsConstructor
public class CatalogPublicController {

    private final CategoryService categoryService;
    private final ProductService productService;
    private final InventoryRepository inventoryRepository;

    @GetMapping("/categories")
    public List<CategoryDto> categories() {
        return categoryService.list();
    }



    @GetMapping("/products")
    public Page<ProductDto> products(
            @RequestParam(required = false) String q,
            @RequestParam(required = false) UUID categoryId,
            @RequestParam(required = false) String categorySlug,
            @RequestParam(required = false) String subcategoryName,
            @RequestParam(required = false) Boolean active,
            @PageableDefault(size = 20, sort = "title", direction = Sort.Direction.ASC)
            Pageable pageable
    ) {
        return productService.search(q, categoryId, categorySlug, subcategoryName, active, pageable);
    }

    @GetMapping("/products/{id}")
    public ProductDto product(@PathVariable UUID id) {
        return productService.get(id);
    }

    @GetMapping("/products/barcode/{barcode}")
    public ProductDto productByBarcode(@PathVariable String barcode) {
        return productService.findByBarcode(barcode);
    }

    @PostMapping("/products/batch")
    public List<ProductDto> productsBatch(@Valid @RequestBody BatchRequest req) {
        return productService.findAllByIds(req.ids());
    }

    /**
     * Lists every active store that currently has at least one unit of the
     * given product in stock. Used by the buyer scan flow when the active
     * store has no inventory — the client offers a one-tap switch instead
     * of a dead-end "not available" error.
     */
    @GetMapping("/products/{id}/stores")
    public List<ProductStoreAvailabilityDto> storesForProduct(@PathVariable UUID id) {
        return inventoryRepository.findInStockStoresByProduct_Id(id).stream()
                .map(inv -> new ProductStoreAvailabilityDto(
                        inv.getStore().getId(),
                        inv.getStore().getName(),
                        inv.getStore().getAddress(),
                        inv.getStore().getLatitude(),
                        inv.getStore().getLongitude(),
                        inv.getQuantity()
                ))
                .toList();
    }
}