package com.darshad.project.order;

import com.darshad.project.cart.Cart;
import com.darshad.project.cart.CartItem;
import com.darshad.project.cart.CartRepository;
import com.darshad.project.catalog.product.Product;
import com.darshad.project.catalog.product.ProductRepository;
import com.darshad.project.store.dto.Inventory;
import com.darshad.project.store.InventoryRepository;
import com.darshad.project.store.Store;
import com.darshad.project.store.StoreRepository;
import com.darshad.project.user.User;
import com.darshad.project.user.UserRepository;
import jakarta.persistence.EntityManager;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.test.util.ReflectionTestUtils;

import java.math.BigDecimal;
import java.time.OffsetDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
@DisplayName("OrderService")
class OrderServiceTest {

    @Mock CartRepository cartRepo;
    @Mock OrderRepository orderRepo;
    @Mock ProductRepository productRepo;
    @Mock UserRepository userRepo;
    @Mock InventoryRepository inventoryRepo;
    @Mock StoreRepository storeRepo;
    @Mock EntityManager entityManager;

    @InjectMocks OrderService orderService;

    UUID userId, storeId, productId;
    User user;
    Store store;
    Product product;

    @BeforeEach
    void setUp() {
        ReflectionTestUtils.setField(orderService, "entityManager", entityManager);
        userId = UUID.randomUUID();
        storeId = UUID.randomUUID();
        productId = UUID.randomUUID();

        user = User.builder().id(userId).email("buyer@test.com").build();
        store = Store.builder().id(storeId).name("Store").build();
        product = Product.builder()
                .id(productId)
                .title("Milk")
                .price(BigDecimal.valueOf(800))
                .active(true)
                .build();
    }

    // ===================== checkout =====================

    @Nested
    @DisplayName("checkout")
    class Checkout {

        @Test
        @DisplayName("успешный checkout — создаёт заказ, уменьшает stock")
        void success() {
            CartItem cartItem = CartItem.builder()
                    .product(product)
                    .quantity(2)
                    .price(BigDecimal.valueOf(800))
                    .build();
            Cart cart = Cart.builder()
                    .id(UUID.randomUUID())
                    .user(user)
                    .store(store)
                    .items(new ArrayList<>(List.of(cartItem)))
                    .build();

            Inventory inv = Inventory.builder()
                    .store(store).product(product).quantity(10).build();

            when(userRepo.findByEmail("buyer@test.com")).thenReturn(Optional.of(user));
            when(cartRepo.findGraphByUserIdAndStoreId(userId, storeId)).thenReturn(Optional.of(cart));
            when(productRepo.findById(productId)).thenReturn(Optional.of(product));
            when(inventoryRepo.findForUpdateByStore_IdAndProduct_Id(storeId, productId))
                    .thenReturn(Optional.of(inv));
            when(entityManager.getReference(Store.class, storeId)).thenReturn(store);
            when(orderRepo.save(any(Order.class))).thenAnswer(inv2 -> {
                Order o = inv2.getArgument(0);
                o.setId(UUID.randomUUID());
                o.setCreatedAt(OffsetDateTime.now());
                return o;
            });

            OrderResponse result = orderService.checkout("buyer@test.com",
                    new CheckoutRequest(storeId, "test comment"));

            assertThat(result.status()).isEqualTo("CREATED");
            assertThat(result.totalAmount()).isEqualByComparingTo(BigDecimal.valueOf(1600));
            assertThat(inv.getQuantity()).isEqualTo(8); // 10 - 2
            verify(orderRepo).save(any(Order.class));
        }

        @Test
        @DisplayName("пустая корзина — ошибка")
        void emptyCart() {
            Cart cart = Cart.builder()
                    .id(UUID.randomUUID())
                    .user(user)
                    .store(store)
                    .items(new ArrayList<>())
                    .build();

            when(userRepo.findByEmail("buyer@test.com")).thenReturn(Optional.of(user));
            when(cartRepo.findGraphByUserIdAndStoreId(userId, storeId)).thenReturn(Optional.of(cart));

            assertThatThrownBy(() ->
                    orderService.checkout("buyer@test.com", new CheckoutRequest(storeId, null)))
                    .isInstanceOf(IllegalStateException.class)
                    .hasMessageContaining("empty");
        }

        @Test
        @DisplayName("недостаточно товара — ошибка")
        void notEnoughInventory() {
            CartItem cartItem = CartItem.builder()
                    .product(product)
                    .quantity(20)
                    .price(BigDecimal.valueOf(800))
                    .build();
            Cart cart = Cart.builder()
                    .id(UUID.randomUUID())
                    .user(user)
                    .store(store)
                    .items(new ArrayList<>(List.of(cartItem)))
                    .build();

            Inventory inv = Inventory.builder()
                    .store(store).product(product).quantity(5).build();

            when(userRepo.findByEmail("buyer@test.com")).thenReturn(Optional.of(user));
            when(cartRepo.findGraphByUserIdAndStoreId(userId, storeId)).thenReturn(Optional.of(cart));
            when(productRepo.findById(productId)).thenReturn(Optional.of(product));
            when(inventoryRepo.findForUpdateByStore_IdAndProduct_Id(storeId, productId))
                    .thenReturn(Optional.of(inv));
            when(entityManager.getReference(Store.class, storeId)).thenReturn(store);

            assertThatThrownBy(() ->
                    orderService.checkout("buyer@test.com", new CheckoutRequest(storeId, null)))
                    .isInstanceOf(IllegalStateException.class)
                    .hasMessageContaining("Not enough stock");
        }

        @Test
        @DisplayName("неактивный продукт при checkout — ошибка")
        void inactiveProductAtCheckout() {
            product.setActive(false);
            CartItem cartItem = CartItem.builder()
                    .product(product).quantity(1).price(BigDecimal.valueOf(800)).build();
            Cart cart = Cart.builder()
                    .id(UUID.randomUUID()).user(user).store(store)
                    .items(new ArrayList<>(List.of(cartItem))).build();

            when(userRepo.findByEmail("buyer@test.com")).thenReturn(Optional.of(user));
            when(cartRepo.findGraphByUserIdAndStoreId(userId, storeId)).thenReturn(Optional.of(cart));
            when(productRepo.findById(productId)).thenReturn(Optional.of(product));
            when(entityManager.getReference(Store.class, storeId)).thenReturn(store);

            assertThatThrownBy(() ->
                    orderService.checkout("buyer@test.com", new CheckoutRequest(storeId, null)))
                    .isInstanceOf(IllegalStateException.class)
                    .hasMessageContaining("inactive");
        }
    }

    // ===================== updateStatus =====================

    @Nested
    @DisplayName("updateStatus")
    class UpdateStatus {

        Order order;

        @BeforeEach
        void setUp() {
            order = Order.builder()
                    .id(UUID.randomUUID())
                    .user(user)
                    .store(store)
                    .status(OrderStatus.CREATED)
                    .totalAmount(BigDecimal.valueOf(1000))
                    .items(new ArrayList<>())
                    .createdAt(OffsetDateTime.now())
                    .build();
        }

        @Test
        @DisplayName("CREATED → CONFIRMED — допустимый переход")
        void validTransition() {
            when(orderRepo.findByIdWithItems(order.getId())).thenReturn(Optional.of(order));

            OrderResponse result = orderService.updateStatus(order.getId(), OrderStatus.CONFIRMED);

            assertThat(result.status()).isEqualTo("CONFIRMED");
            assertThat(order.getStatus()).isEqualTo(OrderStatus.CONFIRMED);
        }

        @Test
        @DisplayName("CREATED → DELIVERED — недопустимый переход")
        void invalidTransition() {
            when(orderRepo.findByIdWithItems(order.getId())).thenReturn(Optional.of(order));

            assertThatThrownBy(() ->
                    orderService.updateStatus(order.getId(), OrderStatus.DELIVERED))
                    .isInstanceOf(IllegalStateException.class)
                    .hasMessageContaining("Illegal status transition");
        }

        @Test
        @DisplayName("тот же статус — no-op")
        void sameStatusNoOp() {
            when(orderRepo.findByIdWithItems(order.getId())).thenReturn(Optional.of(order));

            OrderResponse result = orderService.updateStatus(order.getId(), OrderStatus.CREATED);

            assertThat(result.status()).isEqualTo("CREATED");
        }
    }

    // ===================== cancelOwnOrder =====================

    @Nested
    @DisplayName("cancelOwnOrder")
    class CancelOwnOrder {

        @Test
        @DisplayName("CREATED заказ — отмена успешна, stock возвращается")
        void cancelCreatedOrder() {
            OrderItem orderItem = OrderItem.builder()
                    .id(UUID.randomUUID())
                    .product(product)
                    .quantity(3)
                    .price(BigDecimal.valueOf(800))
                    .lineTotal(BigDecimal.valueOf(2400))
                    .build();

            Order order = Order.builder()
                    .id(UUID.randomUUID())
                    .user(user)
                    .store(store)
                    .status(OrderStatus.CREATED)
                    .totalAmount(BigDecimal.valueOf(2400))
                    .items(new ArrayList<>(List.of(orderItem)))
                    .createdAt(OffsetDateTime.now())
                    .build();

            Inventory inv = Inventory.builder()
                    .store(store).product(product).quantity(7).build();

            when(userRepo.findByEmail("buyer@test.com")).thenReturn(Optional.of(user));
            when(orderRepo.findByIdAndUserIdWithItems(order.getId(), userId))
                    .thenReturn(Optional.of(order));
            when(inventoryRepo.findForUpdateByStore_IdAndProduct_Id(storeId, productId))
                    .thenReturn(Optional.of(inv));

            OrderResponse result = orderService.cancelOwnOrder("buyer@test.com", order.getId());

            assertThat(result.status()).isEqualTo("CANCELLED");
            assertThat(inv.getQuantity()).isEqualTo(10); // 7 + 3 returned
        }

        @Test
        @DisplayName("SHIPPED заказ — отмена запрещена")
        void cannotCancelShipped() {
            Order order = Order.builder()
                    .id(UUID.randomUUID())
                    .user(user)
                    .store(store)
                    .status(OrderStatus.SHIPPED)
                    .totalAmount(BigDecimal.valueOf(1000))
                    .items(new ArrayList<>())
                    .createdAt(OffsetDateTime.now())
                    .build();

            when(userRepo.findByEmail("buyer@test.com")).thenReturn(Optional.of(user));
            when(orderRepo.findByIdAndUserIdWithItems(order.getId(), userId))
                    .thenReturn(Optional.of(order));

            assertThatThrownBy(() ->
                    orderService.cancelOwnOrder("buyer@test.com", order.getId()))
                    .isInstanceOf(IllegalStateException.class)
                    .hasMessageContaining("can no longer be cancelled");
        }
    }

    // ===================== myOrders =====================

    @Nested
    @DisplayName("myOrders")
    class MyOrders {

        @Test
        @DisplayName("возвращает список заказов пользователя")
        void returnsOrders() {
            Order o1 = Order.builder()
                    .id(UUID.randomUUID()).user(user).store(store)
                    .status(OrderStatus.CREATED)
                    .totalAmount(BigDecimal.valueOf(500))
                    .createdAt(OffsetDateTime.now())
                    .build();

            when(userRepo.findByEmail("buyer@test.com")).thenReturn(Optional.of(user));
            when(orderRepo.findByUserIdOrderByCreatedAtDesc(userId)).thenReturn(List.of(o1));

            List<OrderResponse> result = orderService.myOrders("buyer@test.com");

            assertThat(result).hasSize(1);
            assertThat(result.get(0).totalAmount()).isEqualByComparingTo(BigDecimal.valueOf(500));
        }

        @Test
        @DisplayName("неизвестный пользователь — ошибка")
        void unknownUser() {
            when(userRepo.findByEmail("ghost@test.com")).thenReturn(Optional.empty());

            assertThatThrownBy(() -> orderService.myOrders("ghost@test.com"))
                    .isInstanceOf(IllegalStateException.class)
                    .hasMessageContaining("User not found");
        }
    }
}
