package com.darshad.project.admin;

import jakarta.validation.Valid;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

/**
 * ТЗ-12: Admin/merchant inventory management.
 *
 * GET  /api/admin/inventory?storeId=   — list all inventory for a store
 * POST /api/admin/inventory            — set absolute quantity for a product in a store
 *                                        (creates row if missing, updates if exists)
 */
@PreAuthorize("hasAnyRole('ADMIN','MERCHANT')")
@RestController
@RequestMapping("/api/admin/inventory")
@RequiredArgsConstructor
public class InventoryAdminController {

    private final InventoryAdminService inventoryAdminService;

    @GetMapping
    public List<InventoryItemResponse> getInventory(Authentication auth, @RequestParam UUID storeId) {
        return inventoryAdminService.getInventory(auth.getName(), storeId);
    }

    @PostMapping
    public InventoryItemResponse upsert(Authentication auth, @Valid @RequestBody UpsertInventoryRequest req) {
        return inventoryAdminService.upsertInventory(auth.getName(), req.storeId(), req.productId(), req.quantity());
    }

    public record UpsertInventoryRequest(
            @NotNull UUID storeId,
            @NotNull UUID productId,
            @Min(0) int quantity
    ) {}
}
