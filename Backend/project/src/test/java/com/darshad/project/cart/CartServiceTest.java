package com.darshad.project.cart;

import com.darshad.project.cart.dto.AddToCartRequest;
import com.darshad.project.cart.dto.CartDto;
import com.darshad.project.cart.dto.UpdateCartItemRequest;
import com.darshad.project.catalog.product.Product;
import com.darshad.project.catalog.product.ProductRepository;
import com.darshad.project.store.dto.Inventory;
import com.darshad.project.store.InventoryRepository;
import com.darshad.project.store.Store;
import com.darshad.project.store.StoreRepository;
import com.darshad.project.user.User;
import com.darshad.project.user.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
@DisplayName("CartService")
class CartServiceTest {

    @Mock CartRepository cartRepo;
    @Mock CartItemRepository itemRepo;
    @Mock UserRepository userRepo;
    @Mock ProductRepository productRepo;
    @Mock StoreRepository storeRepo;
    @Mock InventoryRepository inventoryRepo;

    @InjectMocks CartService cartService;

    UUID userId, storeId, productId, cartId;
    User user;
    Store store;
    Product product;
    Cart cart;

    @BeforeEach
    void setUp() {
        userId = UUID.randomUUID();
        storeId = UUID.randomUUID();
        productId = UUID.randomUUID();
        cartId = UUID.randomUUID();

        user = User.builder().id(userId).email("buyer@test.com").build();
        store = Store.builder().id(storeId).name("Test Store").build();
        product = Product.builder()
                .id(productId)
                .title("Apple")
                .price(BigDecimal.valueOf(500))
                .active(true)
                .build();
        cart = Cart.builder().id(cartId).user(user).store(store).items(new ArrayList<>()).build();
    }

    // ===================== getMyCart =====================

    @Nested
    @DisplayName("getMyCart")
    class GetMyCart {

        @Test
        @DisplayName("пустая корзина — возвращает пустой CartDto")
        void emptyCart() {
            when(userRepo.findByEmail("buyer@test.com")).thenReturn(Optional.of(user));
            when(cartRepo.findGraphByUserIdAndStoreId(userId, storeId)).thenReturn(Optional.empty());

            CartDto dto = cartService.getMyCart("buyer@test.com", storeId);

            assertThat(dto.items()).isEmpty();
            assertThat(dto.total()).isEqualByComparingTo(BigDecimal.ZERO);
        }

        @Test
        @DisplayName("корзина с товарами — считает итого")
        void cartWithItems() {
            CartItem item = CartItem.builder()
                    .id(UUID.randomUUID())
                    .cart(cart)
                    .product(product)
                    .quantity(3)
                    .price(BigDecimal.valueOf(500))
                    .build();
            cart.getItems().add(item);

            when(userRepo.findByEmail("buyer@test.com")).thenReturn(Optional.of(user));
            when(cartRepo.findGraphByUserIdAndStoreId(userId, storeId)).thenReturn(Optional.of(cart));

            CartDto dto = cartService.getMyCart("buyer@test.com", storeId);

            assertThat(dto.items()).hasSize(1);
            assertThat(dto.total()).isEqualByComparingTo(BigDecimal.valueOf(1500));
        }
    }

    // ===================== add =====================

    @Nested
    @DisplayName("add")
    class Add {

        @Test
        @DisplayName("новый товар добавляется в корзину")
        void addNewItem() {
            when(userRepo.findByEmail("buyer@test.com")).thenReturn(Optional.of(user));
            when(storeRepo.findById(storeId)).thenReturn(Optional.of(store));
            when(cartRepo.findGraphByUserIdAndStoreId(userId, storeId)).thenReturn(Optional.of(cart));
            when(productRepo.findById(productId)).thenReturn(Optional.of(product));
            when(inventoryRepo.findByStore_IdAndProduct_Id(storeId, productId))
                    .thenReturn(Optional.of(Inventory.builder().quantity(10).build()));
            when(itemRepo.findByCartIdAndProductId(cartId, productId)).thenReturn(Optional.empty());
            when(itemRepo.save(any())).thenAnswer(inv -> inv.getArgument(0));
            when(cartRepo.findGraphById(cartId)).thenReturn(Optional.of(cart));

            cartService.add("buyer@test.com", storeId, new AddToCartRequest(productId, 2));

            verify(itemRepo).save(argThat(item ->
                    item.getQuantity() == 2
                    && item.getPrice().compareTo(BigDecimal.valueOf(500)) == 0
            ));
        }

        @Test
        @DisplayName("недостаточно товара на складе — ошибка")
        void notEnoughStock() {
            when(userRepo.findByEmail("buyer@test.com")).thenReturn(Optional.of(user));
            when(storeRepo.findById(storeId)).thenReturn(Optional.of(store));
            when(cartRepo.findGraphByUserIdAndStoreId(userId, storeId)).thenReturn(Optional.of(cart));
            when(productRepo.findById(productId)).thenReturn(Optional.of(product));
            when(inventoryRepo.findByStore_IdAndProduct_Id(storeId, productId))
                    .thenReturn(Optional.of(Inventory.builder().quantity(1).build()));

            assertThatThrownBy(() ->
                    cartService.add("buyer@test.com", storeId, new AddToCartRequest(productId, 5)))
                    .isInstanceOf(IllegalStateException.class)
                    .hasMessageContaining("Not enough stock");
        }

        @Test
        @DisplayName("неактивный товар — ошибка")
        void inactiveProduct() {
            product.setActive(false);

            when(userRepo.findByEmail("buyer@test.com")).thenReturn(Optional.of(user));
            when(storeRepo.findById(storeId)).thenReturn(Optional.of(store));
            when(cartRepo.findGraphByUserIdAndStoreId(userId, storeId)).thenReturn(Optional.of(cart));
            when(productRepo.findById(productId)).thenReturn(Optional.of(product));

            assertThatThrownBy(() ->
                    cartService.add("buyer@test.com", storeId, new AddToCartRequest(productId, 1)))
                    .isInstanceOf(IllegalStateException.class)
                    .hasMessageContaining("inactive");
        }

        @Test
        @DisplayName("существующий товар в корзине — qty увеличивается")
        void existingItemQtyIncreases() {
            CartItem existing = CartItem.builder()
                    .id(UUID.randomUUID())
                    .cart(cart)
                    .product(product)
                    .quantity(2)
                    .price(BigDecimal.valueOf(500))
                    .build();

            when(userRepo.findByEmail("buyer@test.com")).thenReturn(Optional.of(user));
            when(storeRepo.findById(storeId)).thenReturn(Optional.of(store));
            when(cartRepo.findGraphByUserIdAndStoreId(userId, storeId)).thenReturn(Optional.of(cart));
            when(productRepo.findById(productId)).thenReturn(Optional.of(product));
            when(inventoryRepo.findByStore_IdAndProduct_Id(storeId, productId))
                    .thenReturn(Optional.of(Inventory.builder().quantity(10).build()));
            when(itemRepo.findByCartIdAndProductId(cartId, productId)).thenReturn(Optional.of(existing));
            when(cartRepo.findGraphById(cartId)).thenReturn(Optional.of(cart));

            cartService.add("buyer@test.com", storeId, new AddToCartRequest(productId, 3));

            assertThat(existing.getQuantity()).isEqualTo(5);
        }
    }

    // ===================== removeItem =====================

    @Nested
    @DisplayName("removeItem")
    class RemoveItem {

        @Test
        @DisplayName("чужой товар — ошибка")
        void notYourCartItem() {
            User otherUser = User.builder().id(UUID.randomUUID()).email("other@test.com").build();
            Cart otherCart = Cart.builder().id(UUID.randomUUID()).user(otherUser).store(store).build();
            CartItem item = CartItem.builder().id(UUID.randomUUID()).cart(otherCart).product(product).build();

            when(userRepo.findByEmail("buyer@test.com")).thenReturn(Optional.of(user));
            when(itemRepo.findById(item.getId())).thenReturn(Optional.of(item));

            assertThatThrownBy(() ->
                    cartService.removeItem("buyer@test.com", storeId, item.getId()))
                    .isInstanceOf(IllegalStateException.class)
                    .hasMessageContaining("Not your cart");
        }
    }

    // ===================== clear =====================

    @Nested
    @DisplayName("clear")
    class Clear {

        @Test
        @DisplayName("очищает все товары из корзины")
        void clearsAll() {
            CartItem item1 = CartItem.builder().id(UUID.randomUUID()).cart(cart).product(product).quantity(1).price(BigDecimal.TEN).build();
            cart.getItems().add(item1);

            when(userRepo.findByEmail("buyer@test.com")).thenReturn(Optional.of(user));
            when(cartRepo.findGraphByUserIdAndStoreId(userId, storeId)).thenReturn(Optional.of(cart));
            when(cartRepo.findGraphById(cartId)).thenReturn(Optional.of(Cart.builder().id(cartId).user(user).store(store).items(new ArrayList<>()).build()));

            CartDto dto = cartService.clear("buyer@test.com", storeId);

            verify(itemRepo).deleteAll(anyList());
        }
    }
}
