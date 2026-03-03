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
    public CartDto myCart(
            @RequestParam UUID storeId,
            Authentication auth
    ) {
        return cartService.getMyCart(auth.getName(), storeId);
    }

    @PostMapping("/items")
    public CartDto add(
            @RequestParam UUID storeId,
            @Valid @RequestBody AddToCartRequest req,
            Authentication auth
    ) {
        return cartService.add(auth.getName(), storeId, req);
    }

    @PutMapping("/items/{itemId}")
    public CartDto update(
            @RequestParam UUID storeId,
            @PathVariable UUID itemId,
            @Valid @RequestBody UpdateCartItemRequest req,
            Authentication auth
    ) {
        return cartService.updateItem(auth.getName(), storeId, itemId, req);
    }

    @DeleteMapping("/items/{itemId}")
    public CartDto remove(
            @RequestParam UUID storeId,
            @PathVariable UUID itemId,
            Authentication auth
    ) {
        return cartService.removeItem(auth.getName(), storeId, itemId);
    }

    @DeleteMapping
    public CartDto clear(
            @RequestParam UUID storeId,
            Authentication auth
    ) {
        return cartService.clear(auth.getName(), storeId);
    }
}