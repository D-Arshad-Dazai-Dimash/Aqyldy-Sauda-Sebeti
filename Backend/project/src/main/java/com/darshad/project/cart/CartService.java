package com.darshad.project.cart;

import com.darshad.project.cart.dto.*;
import com.darshad.project.catalog.product.ProductRepository;
import com.darshad.project.user.User;
import com.darshad.project.user.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class CartService {

    private final CartRepository cartRepo;
    private final CartItemRepository itemRepo;
    private final UserRepository userRepo;
    private final ProductRepository productRepo;

    @Transactional(readOnly = true)
    public CartDto getMyCart(String email) {
        var user = getUserByEmail(email);
        var cart = cartRepo.findByUserId(user.getId()).orElseGet(() -> null);

        if (cart == null) {
            return new CartDto(null, java.util.List.of(), BigDecimal.ZERO);
        }
        return toDto(cart);
    }

    @Transactional
    public CartDto add(String email, AddToCartRequest req) {
        var user = getUserByEmail(email);

        var cart = cartRepo.findByUserId(user.getId())
                .orElseGet(() -> cartRepo.save(Cart.builder().user(user).build()));

        var product = productRepo.findById(req.productId())
                .orElseThrow(() -> new IllegalStateException("Product not found"));

        var existing = itemRepo.findByCartIdAndProductId(cart.getId(), product.getId()).orElse(null);

        if (existing == null) {
            itemRepo.save(CartItem.builder()
                    .cart(cart)
                    .product(product)
                    .quantity(req.quantity())
                    .build());
        } else {
            existing.setQuantity(existing.getQuantity() + req.quantity());
        }

        // перезагрузим с items graph
        cart = cartRepo.findByUserId(user.getId()).orElseThrow();
        return toDto(cart);
    }

    @Transactional
    public CartDto updateItem(String email, UUID itemId, UpdateCartItemRequest req) {
        var user = getUserByEmail(email);
        var cart = cartRepo.findByUserId(user.getId()).orElseThrow(() -> new IllegalStateException("Cart not found"));

        var item = itemRepo.findById(itemId).orElseThrow(() -> new IllegalStateException("Cart item not found"));
        if (!item.getCart().getId().equals(cart.getId())) {
            throw new IllegalStateException("Not your cart item");
        }

        item.setQuantity(req.quantity());

        cart = cartRepo.findByUserId(user.getId()).orElseThrow();
        return toDto(cart);
    }

    @Transactional
    public CartDto removeItem(String email, UUID itemId) {
        var user = getUserByEmail(email);
        var cart = cartRepo.findByUserId(user.getId()).orElseThrow(() -> new IllegalStateException("Cart not found"));

        var item = itemRepo.findById(itemId).orElseThrow(() -> new IllegalStateException("Cart item not found"));
        if (!item.getCart().getId().equals(cart.getId())) {
            throw new IllegalStateException("Not your cart item");
        }

        itemRepo.delete(item);

        cart = cartRepo.findByUserId(user.getId()).orElseThrow();
        return toDto(cart);
    }

    @Transactional
    public CartDto clear(String email) {
        var user = getUserByEmail(email);
        var cart = cartRepo.findByUserId(user.getId()).orElseThrow(() -> new IllegalStateException("Cart not found"));
        cart.getItems().clear();
        cart = cartRepo.findByUserId(user.getId()).orElseThrow();
        return toDto(cart);
    }

    private User getUserByEmail(String email) {
        return userRepo.findByEmail(email).orElseThrow(() -> new IllegalStateException("User not found"));
    }

    private CartDto toDto(Cart cart) {
        var items = cart.getItems().stream().map(i -> {
            var price = i.getProduct().getPrice();
            var lineTotal = price.multiply(BigDecimal.valueOf(i.getQuantity()));
            return new CartItemDto(
                    i.getId(),
                    i.getProduct().getId(),
                    i.getProduct().getTitle(),
                    price,
                    i.getProduct().getImageUrl(),
                    i.getQuantity(),
                    lineTotal
            );
        }).toList();

        var total = items.stream()
                .map(CartItemDto::lineTotal)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        return new CartDto(cart.getId(), items, total);
    }
}