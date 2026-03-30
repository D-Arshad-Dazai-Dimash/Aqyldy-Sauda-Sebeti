package com.darshad.project.order;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/orders")
@RequiredArgsConstructor
public class OrderController {

    private final OrderService orderService;

    @PostMapping("/checkout")
    public OrderResponse checkout(@Valid @RequestBody CheckoutRequest req, Authentication auth) {
        return orderService.checkout(auth.getName(), req);
    }

    @GetMapping("/my")
    public List<OrderResponse> myOrders(Authentication auth) {
        return orderService.myOrders(auth.getName());
    }

    @GetMapping("/{id}")
    public OrderDetailResponse getOrderById(@PathVariable UUID id, Authentication auth) {
        return orderService.getOrderById(auth.getName(), id);
    }
}