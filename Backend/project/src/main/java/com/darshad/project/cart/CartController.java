package com.darshad.project.cart;

import com.darshad.project.cart.dto.*;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

@RestController
@RequestMapping("/api/cart")
@RequiredArgsConstructor
public class CartController {

    private final CartService cartService;

    @GetMapping
    public CartDto myCart(Authentication auth) {
        return cartService.getMyCart(auth.getName()); // auth.getName() = email
    }

    @PostMapping("/items")
    public CartDto add(@Valid @RequestBody AddToCartRequest req, Authentication auth) {
        return cartService.add(auth.getName(), req);
    }

    @PutMapping("/items/{itemId}")
    public CartDto update(@PathVariable UUID itemId, @Valid @RequestBody UpdateCartItemRequest req, Authentication auth) {
        return cartService.updateItem(auth.getName(), itemId, req);
    }

    @DeleteMapping("/items/{itemId}")
    public CartDto remove(@PathVariable UUID itemId, Authentication auth) {
        return cartService.removeItem(auth.getName(), itemId);
    }

    @DeleteMapping
    public CartDto clear(Authentication auth) {
        return cartService.clear(auth.getName());
    }
}