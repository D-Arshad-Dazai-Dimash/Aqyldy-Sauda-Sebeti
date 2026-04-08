package com.darshad.project.order;

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
 * Mounted under {@code /api/admin/orders} so the existing
 * {@code /api/admin/**} security rule (hasRole('ADMIN')) applies. The
 * @PreAuthorize is repeated as a defence-in-depth.
 */
@PreAuthorize("hasRole('ADMIN')")
@RestController
@RequestMapping("/api/admin/orders")
@RequiredArgsConstructor
public class OrderAdminController {

    private final OrderService orderService;

    /** ТЗ-11: paginated list of orders in the merchant's stores. */
    @GetMapping
    public Page<OrderResponse> listOrders(
            Authentication auth,
            @RequestParam(required = false) OrderStatus status,
            @PageableDefault(size = 20) Pageable pageable
    ) {
        return orderService.getOrdersForMerchant(auth.getName(), status, pageable);
    }

    /** ТЗ-11: full detail for any order (admin/merchant). */
    @GetMapping("/{id}")
    public OrderDetailResponse getOrderDetail(@PathVariable UUID id) {
        return orderService.getOrderDetailAdmin(id);
    }

    @PatchMapping("/{id}/status")
    public OrderResponse updateStatus(
            @PathVariable UUID id,
            @Valid @RequestBody UpdateOrderStatusRequest req
    ) {
        return orderService.updateStatus(id, req.status());
    }

    public record UpdateOrderStatusRequest(@NotNull OrderStatus status) {}
}
