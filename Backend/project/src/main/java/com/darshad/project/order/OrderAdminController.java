package com.darshad.project.order;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotNull;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
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

    @PatchMapping("/{id}/status")
    public OrderResponse updateStatus(
            @PathVariable UUID id,
            @Valid @RequestBody UpdateOrderStatusRequest req
    ) {
        return orderService.updateStatus(id, req.status());
    }

    public record UpdateOrderStatusRequest(@NotNull OrderStatus status) {}
}
