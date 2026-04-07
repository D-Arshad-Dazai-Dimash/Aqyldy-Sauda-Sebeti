package com.darshad.project.catalog;

import com.darshad.project.catalog.product.ProductDto;
import com.darshad.project.catalog.product.ProductService;
import com.darshad.project.catalog.product.ProductUpsertRequest;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.UUID;

@PreAuthorize("hasRole('ADMIN')")
@RestController
@RequestMapping("/api/admin/products")
@RequiredArgsConstructor
public class CatalogAdminController {

    private final ProductService productService;

    @PostMapping
    public ProductDto create(@Valid @RequestBody ProductUpsertRequest req) {
        return productService.create(req);
    }

    @PutMapping("/{id}")
    public ProductDto update(
            @PathVariable UUID id,
            @Valid @RequestBody ProductUpsertRequest req
    ) {
        return productService.update(id, req);
    }

    @DeleteMapping("/{id}")
    public void delete(@PathVariable UUID id) {
        productService.delete(id);
    }

    /**
     * B8: Multipart upload of a product image. Stored to the local
     * uploads directory and the public URL is written back to the
     * product. Returns the updated product DTO so the frontend can
     * pick up the new {@code imageUrl} without an extra GET.
     */
    @PostMapping("/{id}/image")
    public ProductDto uploadImage(@PathVariable UUID id,
                                  @RequestParam("file") MultipartFile file) {
        return productService.uploadImage(id, file);
    }
}