package com.darshad.project.order;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotNull;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

/**
 * B5: Admin endpoints for moving an order through its lifecycle.
 *
 * Mounted under {@code /api/admin/orders} for business operations.
 * @PreAuthorize is repeated as a defence-in-depth.
 */
@PreAuthorize("hasAnyRole('ADMIN','MERCHANT')")
@RestController
@RequestMapping("/api/admin/orders")
@RequiredArgsConstructor
@Tag(name = "Admin Orders", description = "Merchant/admin order operations")
@SecurityRequirement(name = "bearerAuth")
public class OrderAdminController {

    private final OrderService orderService;

    /** ТЗ-11: paginated list of orders in the merchant's stores. */
    @GetMapping
    @Operation(summary = "List merchant orders", description = "Returns paginated list of orders for admin/merchant stores.")
    public Page<OrderResponse> listOrders(
            Authentication auth,
            @RequestParam(required = false) OrderStatus status,
            @PageableDefault(size = 20) Pageable pageable
    ) {
        return orderService.getOrdersForMerchant(auth.getName(), status, pageable);
    }

    /** ТЗ-11: full detail for any order (admin/merchant). */
    @GetMapping("/{id}")
    @Operation(summary = "Get order detail (admin)", description = "Returns full order details for admin/merchant view.")
    public OrderDetailResponse getOrderDetail(Authentication auth, @PathVariable UUID id) {
        return orderService.getOrderDetailForActor(auth.getName(), id);
    }

    @PatchMapping("/{id}/status")
    @Operation(summary = "Update order status", description = "Moves order through allowed lifecycle transitions.")
    public OrderResponse updateStatus(
            Authentication auth,
            @PathVariable UUID id,
            @Valid @RequestBody UpdateOrderStatusRequest req
    ) {
        return orderService.updateStatusForActor(auth.getName(), id, req.status());
    }

    public record UpdateOrderStatusRequest(@NotNull OrderStatus status) {}
}
