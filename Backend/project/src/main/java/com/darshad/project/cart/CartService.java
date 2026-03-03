package com.darshad.project.cart;

import com.darshad.project.cart.dto.*;
import com.darshad.project.catalog.product.ProductRepository;
import com.darshad.project.store.StoreRepository;
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
    private final StoreRepository storeRepo;

    @Transactional(readOnly = true)
    public CartDto getMyCart(String email, UUID storeId) {
        var user = getUserByEmail(email);

        var cart = cartRepo.findGraphByUserIdAndStoreId(user.getId(), storeId).orElse(null);
        if (cart == null) {
            return new CartDto(null, java.util.List.of(), BigDecimal.ZERO);
        }
        return toDto(cart);
    }

    @Transactional
    public CartDto add(String email, UUID storeId, AddToCartRequest req) {
        var user = getUserByEmail(email);

        var store = storeRepo.findById(storeId)
                .orElseThrow(() -> new IllegalStateException("Store not found"));

        var cart = cartRepo.findGraphByUserIdAndStoreId(user.getId(), storeId)
                .orElseGet(() -> cartRepo.save(Cart.builder().user(user).store(store).build()));

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

        // важно: вернуть актуальную корзину с items+product
        var refreshed = cartRepo.findGraphById(cart.getId()).orElseThrow();
        return toDto(refreshed);
    }

    @Transactional
    public CartDto updateItem(String email, UUID storeId, UUID itemId, UpdateCartItemRequest req) {
        var user = getUserByEmail(email);

        var item = itemRepo.findById(itemId)
                .orElseThrow(() -> new IllegalStateException("Cart item not found"));

        var cart = item.getCart();

        if (!cart.getUser().getId().equals(user.getId())) {
            throw new IllegalStateException("Not your cart item");
        }
        if (cart.getStore() == null || !cart.getStore().getId().equals(storeId)) {
            throw new IllegalStateException("Cart item not in this store");
        }

        item.setQuantity(req.quantity());

        var refreshed = cartRepo.findGraphById(cart.getId()).orElseThrow();
        return toDto(refreshed);
    }

    @Transactional
    public CartDto removeItem(String email, UUID storeId, UUID itemId) {
        var user = getUserByEmail(email);

        var item = itemRepo.findById(itemId)
                .orElseThrow(() -> new IllegalStateException("Cart item not found"));

        var cart = item.getCart();

        if (!cart.getUser().getId().equals(user.getId())) {
            throw new IllegalStateException("Not your cart item");
        }
        if (cart.getStore() == null || !cart.getStore().getId().equals(storeId)) {
            throw new IllegalStateException("Cart item not in this store");
        }

        itemRepo.delete(item);

        var refreshed = cartRepo.findGraphById(cart.getId()).orElseThrow();
        return toDto(refreshed);
    }

    @Transactional
    public CartDto clear(String email, UUID storeId) {
        var user = getUserByEmail(email);

        var cart = cartRepo.findGraphByUserIdAndStoreId(user.getId(), storeId)
                .orElseThrow(() -> new IllegalStateException("Cart not found"));

        cart.getItems().clear();

        var refreshed = cartRepo.findGraphById(cart.getId()).orElseThrow();
        return toDto(refreshed);
    }

    private User getUserByEmail(String email) {
        return userRepo.findByEmail(email)
                .orElseThrow(() -> new IllegalStateException("User not found"));
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