package com.darshad.project.order;

import com.darshad.project.cart.CartRepository;
import com.darshad.project.catalog.product.ProductRepository;
import com.darshad.project.store.InventoryRepository;
import com.darshad.project.store.Store;
import com.darshad.project.user.UserRepository;
import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.util.List;

@Service
@RequiredArgsConstructor
public class OrderService {

    private final CartRepository cartRepo;
    private final OrderRepository orderRepo;
    private final ProductRepository productRepo;
    private final UserRepository userRepo;
    private final InventoryRepository inventoryRepo;

    @Transactional
    public OrderResponse checkout(String email, CheckoutRequest request) {

        var user = userRepo.findByEmail(email)
                .orElseThrow(() -> new IllegalStateException("User not found"));

        var storeId = request.storeId();

        var cart = cartRepo.findGraphByUserIdAndStoreId(user.getId(), storeId)
                .orElseThrow(() -> new IllegalStateException("Cart is empty"));

        if (cart.getItems().isEmpty()) {
            throw new IllegalStateException("Cart is empty");
        }

        // создаём заказ (store обязателен)
        var order = Order.builder()
                .user(user)
                .store(new Store(storeId)) // reference по id
                .comment(request.comment())
                .status(OrderStatus.CREATED)
                .build();

        BigDecimal total = BigDecimal.ZERO;

        for (var cartItem : cart.getItems()) {

            var product = productRepo.findById(cartItem.getProduct().getId())
                    .orElseThrow(() -> new IllegalStateException("Product not found"));

            if (!product.isActive()) {
                throw new IllegalStateException("Product inactive: " + product.getTitle());
            }

            // ✅ проверяем остаток в конкретном магазине
            var inv = inventoryRepo.findByStore_IdAndProduct_Id(storeId, product.getId())
                    .orElseThrow(() -> new IllegalStateException("No inventory for product in this store: " + product.getTitle()));

            if (inv.getQuantity() < cartItem.getQuantity()) {
                throw new IllegalStateException(
                        "Not enough stock for: " + product.getTitle() +
                                ". Available=" + inv.getQuantity() +
                                ", requested=" + cartItem.getQuantity()
                );
            }

            // ✅ списываем
            inv.setQuantity(inv.getQuantity() - cartItem.getQuantity());

            BigDecimal lineTotal = product.getPrice()
                    .multiply(BigDecimal.valueOf(cartItem.getQuantity()));

            total = total.add(lineTotal);

            var orderItem = OrderItem.builder()
                    .order(order)
                    .product(product)
                    .quantity(cartItem.getQuantity())
                    .price(product.getPrice())
                    .lineTotal(lineTotal)
                    .build();

            order.getItems().add(orderItem);
        }

        order.setTotalAmount(total);

        orderRepo.save(order);

        // очистка корзины
        cart.getItems().clear();

        return new OrderResponse(
                order.getId(),
                storeId,
                order.getStatus().name(),
                order.getTotalAmount(),
                order.getCreatedAt()
        );
    }

    public List<OrderResponse> myOrders(String email) {

        var user = userRepo.findByEmail(email)
                .orElseThrow(() -> new IllegalStateException("User not found"));

        return orderRepo.findByUserIdOrderByCreatedAtDesc(user.getId())
                .stream()
                .map(o -> new OrderResponse(
                        o.getId(),
                        o.getStore().getId(),
                        o.getStatus().name(),
                        o.getTotalAmount(),
                        o.getCreatedAt()
                ))
                .toList();
    }
}