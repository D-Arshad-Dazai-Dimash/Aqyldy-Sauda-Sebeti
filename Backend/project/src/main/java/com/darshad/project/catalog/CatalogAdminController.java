package com.darshad.project.catalog;

import com.darshad.project.catalog.product.ProductDto;
import com.darshad.project.catalog.product.ProductService;
import com.darshad.project.catalog.product.ProductUpsertRequest;
import com.darshad.project.store.InventoryRepository;
import com.darshad.project.user.Role;
import com.darshad.project.user.UserRepository;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.UUID;

@PreAuthorize("hasAnyRole('ADMIN','MERCHANT')")
@RestController
@RequestMapping("/api/admin/products")
@RequiredArgsConstructor
public class CatalogAdminController {

    private final ProductService productService;
    private final UserRepository userRepository;
    private final InventoryRepository inventoryRepository;

    @GetMapping
    public Page<ProductDto> list(
            @RequestParam(required = false) String q,
            @RequestParam(required = false) Boolean active,
            Pageable pageable
    ) {
        return productService.search(q, null, active, pageable);
    }

    @PostMapping
    public ProductDto create(@Valid @RequestBody ProductUpsertRequest req) {
        return productService.create(req);
    }

    @PutMapping("/{id}")
    public ProductDto update(
            Authentication auth,
            @PathVariable UUID id,
            @Valid @RequestBody ProductUpsertRequest req
    ) {
        assertCanManageProduct(auth, id);
        return productService.update(id, req);
    }

    @DeleteMapping("/{id}")
    public void delete(Authentication auth, @PathVariable UUID id) {
        assertCanManageProduct(auth, id);
        productService.delete(id);
    }

    /**
     * B8: Multipart upload of a product image. Stored to the local
     * uploads directory and the public URL is written back to the
     * product. Returns the updated product DTO so the frontend can
     * pick up the new {@code imageUrl} without an extra GET.
     */
    @PostMapping("/{id}/image")
    public ProductDto uploadImage(Authentication auth,
                                  @PathVariable UUID id,
                                  @RequestParam("file") MultipartFile file) {
        assertCanManageProduct(auth, id);
        return productService.uploadImage(id, file);
    }

    private void assertCanManageProduct(Authentication auth, UUID productId) {
        var user = userRepository.findByEmail(auth.getName())
                .orElseThrow(() -> new IllegalStateException("User not found"));

        if (user.getRole() == Role.ADMIN) {
            return;
        }

        if (!inventoryRepository.existsByStore_OwnerIdAndProduct_Id(user.getId(), productId)) {
            throw new AccessDeniedException("You do not have access to this product");
        }
    }
}