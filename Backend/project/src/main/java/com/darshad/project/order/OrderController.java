package com.darshad.project.order;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/orders")
@RequiredArgsConstructor
@Tag(name = "Orders", description = "Customer order lifecycle")
@SecurityRequirement(name = "bearerAuth")
public class OrderController {

    private final OrderService orderService;

    @PostMapping("/checkout")
    @Operation(summary = "Checkout cart", description = "Creates an order from the current cart and clears cart items.")
    @ApiResponse(responseCode = "200", description = "Order created")
    public OrderResponse checkout(@Valid @RequestBody CheckoutRequest req, Authentication auth) {
        return orderService.checkout(auth.getName(), req);
    }

    @GetMapping("/my")
    @Operation(summary = "List my orders", description = "Returns current user's orders sorted by creation date.")
    public List<OrderResponse> myOrders(Authentication auth) {
        return orderService.myOrders(auth.getName());
    }

    @GetMapping("/{id}")
    @Operation(summary = "Get order details", description = "Returns full order details with items for current user.")
    public OrderDetailResponse getOrderById(@PathVariable UUID id, Authentication auth) {
        return orderService.getOrderById(auth.getName(), id);
    }

    /**
     * B6: User cancels their own order. Allowed only while still in
     * CREATED/PAID — see {@link OrderService#cancelOwnOrder}.
     */
    @PatchMapping("/{id}/cancel")
    @Operation(summary = "Cancel own order", description = "Cancels order in CREATED/PAID state and restores stock.")
    public OrderResponse cancel(@PathVariable UUID id, Authentication auth) {
        return orderService.cancelOwnOrder(auth.getName(), id);
    }

    @DeleteMapping("/{id}")
    @Operation(summary = "Cancel own order (legacy)", description = "Legacy alias for cancel endpoint.")
    public OrderResponse cancelLegacy(@PathVariable UUID id, Authentication auth) {
        return orderService.cancelOwnOrder(auth.getName(), id);
    }
}