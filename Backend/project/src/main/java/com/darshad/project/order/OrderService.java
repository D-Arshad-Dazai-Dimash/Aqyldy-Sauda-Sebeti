package com.darshad.project.order;

import com.darshad.project.cart.CartRepository;
import com.darshad.project.catalog.product.ProductRepository;
import com.darshad.project.store.InventoryRepository;
import com.darshad.project.store.Store;
import com.darshad.project.user.UserRepository;
import jakarta.persistence.EntityManager;
import jakarta.persistence.PersistenceContext;
import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.util.List;

@Service
@RequiredArgsConstructor
public class OrderService {

    private static final Logger log = LoggerFactory.getLogger(OrderService.class);

    private final CartRepository cartRepo;
    private final OrderRepository orderRepo;
    private final ProductRepository productRepo;
    private final UserRepository userRepo;
    private final InventoryRepository inventoryRepo;

    @PersistenceContext
    private EntityManager entityManager;

    @Transactional
    public OrderResponse checkout(String email, CheckoutRequest request) {

        log.info("▶ CHECKOUT: email={}, storeId={}", email, request.storeId());

        var user = userRepo.findByEmail(email)
                .orElseThrow(() -> new IllegalStateException("User not found"));

        var storeId = request.storeId();

        var cart = cartRepo.findGraphByUserIdAndStoreId(user.getId(), storeId)
                .orElseThrow(() -> new IllegalStateException("Cart is empty"));

        if (cart.getItems().isEmpty()) {
            log.warn("  ✗ checkout failed: cart is empty for user={}", email);
            throw new IllegalStateException("Cart is empty");
        }

        log.info("  cart has {} items, processing...", cart.getItems().size());

        var storeRef = entityManager.getReference(Store.class, storeId);

        var order = Order.builder()
                .user(user)
                .store(storeRef)
                .comment(request.comment())
                .status(OrderStatus.CREATED)
                .build();

        BigDecimal total = BigDecimal.ZERO;

        for (var cartItem : cart.getItems()) {

            var product = productRepo.findById(cartItem.getProduct().getId())
                    .orElseThrow(() -> new IllegalStateException("Product not found"));

            if (!product.isActive()) {
                log.warn("  ✗ product inactive during checkout: {}", product.getTitle());
                throw new IllegalStateException("Product inactive: " + product.getTitle());
            }

            // PESSIMISTIC_WRITE lock — prevents two concurrent checkouts
            // from reading the same stock value and overselling.
            var inv = inventoryRepo.findForUpdateByStore_IdAndProduct_Id(storeId, product.getId())
                    .orElseThrow(() -> new IllegalStateException(
                            "No inventory for product in this store: " + product.getTitle()));

            if (inv.getQuantity() < cartItem.getQuantity()) {
                log.warn("  ✗ not enough stock: product={}, requested={}, available={}",
                        product.getTitle(), cartItem.getQuantity(), inv.getQuantity());
                throw new IllegalStateException(
                        "Not enough stock for: " + product.getTitle());
            }

            int oldQty = inv.getQuantity();
            inv.setQuantity(inv.getQuantity() - cartItem.getQuantity());
            inventoryRepo.save(inv);
            log.debug("  inventory updated: product={}, {} → {}", product.getTitle(), oldQty, inv.getQuantity());

            // B7: honour the price snapshot taken at "add to cart" time.
            // If the cart row has a snapshot, that is the contract price the
            // user agreed to. Legacy rows without a snapshot fall back to the
            // live discount math (kept identical to CartService.effectivePrice
            // so historical behaviour is preserved).
            BigDecimal unitPrice;
            if (cartItem.getPrice() != null) {
                unitPrice = cartItem.getPrice();
                log.debug("  using snapshotted cart price: product={}, snapshot={}",
                        product.getTitle(), unitPrice);
            } else {
                unitPrice = product.getPrice();
                if (product.getDiscount() != null && product.getDiscount().compareTo(BigDecimal.ZERO) > 0) {
                    BigDecimal multiplier = BigDecimal.ONE.subtract(
                            product.getDiscount().divide(BigDecimal.valueOf(100), 4, java.math.RoundingMode.HALF_UP)
                    );
                    unitPrice = unitPrice.multiply(multiplier).setScale(2, java.math.RoundingMode.HALF_UP);
                    log.debug("  discount applied (legacy fallback): product={}, original={}, discount={}%, effective={}",
                            product.getTitle(), product.getPrice(), product.getDiscount(), unitPrice);
                }
            }

            BigDecimal lineTotal = unitPrice
                    .multiply(BigDecimal.valueOf(cartItem.getQuantity()));

            total = total.add(lineTotal);

            var orderItem = OrderItem.builder()
                    .order(order)
                    .product(product)
                    .quantity(cartItem.getQuantity())
                    .price(unitPrice)
                    .lineTotal(lineTotal)
                    .build();

            order.getItems().add(orderItem);
        }

        order.setTotalAmount(total);

        orderRepo.save(order);
        log.info("✓ ORDER CREATED: orderId={}, total={}, items={}, user={}",
                order.getId(), total, order.getItems().size(), email);

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

        log.debug("▶ myOrders: email={}", email);

        var user = userRepo.findByEmail(email)
                .orElseThrow(() -> new IllegalStateException("User not found"));

        var orders = orderRepo.findByUserIdOrderByCreatedAtDesc(user.getId())
                .stream()
                .map(o -> new OrderResponse(
                        o.getId(),
                        o.getStore().getId(),
                        o.getStatus().name(),
                        o.getTotalAmount(),
                        o.getCreatedAt()
                ))
                .toList();

        log.debug("  found {} orders for user={}", orders.size(), email);
        return orders;
    }

    public OrderDetailResponse getOrderById(String email, java.util.UUID orderId) {

        log.debug("▶ getOrderById: email={}, orderId={}", email, orderId);

        var user = userRepo.findByEmail(email)
                .orElseThrow(() -> new IllegalStateException("User not found"));

        var order = orderRepo.findByIdAndUserIdWithItems(orderId, user.getId())
                .orElseThrow(() -> new IllegalStateException("Order not found"));

        var items = order.getItems().stream()
                .map(i -> new OrderDetailResponse.OrderItemDetail(
                        i.getId(),
                        i.getProduct().getId(),
                        i.getProduct().getTitle(),
                        i.getProduct().getImageUrl(),
                        i.getQuantity(),
                        i.getPrice(),
                        i.getLineTotal()
                ))
                .toList();

        log.debug("  found order {} with {} items", orderId, items.size());

        return new OrderDetailResponse(
                order.getId(),
                order.getStore().getId(),
                order.getStore().getName(),
                order.getStatus().name(),
                order.getTotalAmount(),
                order.getComment(),
                order.getCreatedAt(),
                items
        );
    }

    /**
     * B5: Admin moves an order through the lifecycle. Validates the
     * transition against {@link OrderStatus#canTransitionTo}. If the
     * destination is CANCELLED, stock is returned to inventory under
     * the same pessimistic lock used at checkout, so two simultaneous
     * cancel/checkout calls cannot interleave on the same row.
     */
    @Transactional
    public OrderResponse updateStatus(java.util.UUID orderId, OrderStatus next) {

        log.info("▶ ADMIN updateStatus: orderId={}, target={}", orderId, next);

        var order = orderRepo.findByIdWithItems(orderId)
                .orElseThrow(() -> new IllegalStateException("Order not found"));

        OrderStatus current = order.getStatus();
        if (current == next) {
            log.debug("  no-op transition: order already in {}", current);
            return toOrderResponse(order);
        }

        if (!current.canTransitionTo(next)) {
            log.warn("  ✗ illegal transition: {} → {}", current, next);
            throw new IllegalStateException(
                    "Illegal status transition: " + current + " → " + next);
        }

        if (next == OrderStatus.CANCELLED) {
            returnStockForCancellation(order);
        }

        order.setStatus(next);
        log.info("✓ order status updated: orderId={}, {} → {}", orderId, current, next);

        return toOrderResponse(order);
    }

    /**
     * B6: User cancels their own order. Allowed only while the order is
     * still in CREATED or PAID — once a merchant has CONFIRMED/SHIPPED
     * the order, the buyer must contact support. Returns stock to the
     * inventory rows the checkout decremented from.
     */
    @Transactional
    public OrderResponse cancelOwnOrder(String email, java.util.UUID orderId) {

        log.info("▶ USER cancelOrder: email={}, orderId={}", email, orderId);

        var user = userRepo.findByEmail(email)
                .orElseThrow(() -> new IllegalStateException("User not found"));

        var order = orderRepo.findByIdAndUserIdWithItems(orderId, user.getId())
                .orElseThrow(() -> new IllegalStateException("Order not found"));

        OrderStatus current = order.getStatus();
        if (current != OrderStatus.CREATED && current != OrderStatus.PAID) {
            log.warn("  ✗ user cancel rejected: order already in {}", current);
            throw new IllegalStateException(
                    "Order can no longer be cancelled by the buyer (status=" + current + ")");
        }

        returnStockForCancellation(order);
        order.setStatus(OrderStatus.CANCELLED);
        log.info("✓ user cancelled order: orderId={}, email={}", orderId, email);

        return toOrderResponse(order);
    }

    /**
     * Returns each order line's quantity to the corresponding inventory
     * row, locking the row first so we cannot race against a concurrent
     * checkout decrement on the same (store, product).
     */
    private void returnStockForCancellation(Order order) {
        var storeId = order.getStore().getId();
        for (var item : order.getItems()) {
            var productId = item.getProduct().getId();
            var inv = inventoryRepo.findForUpdateByStore_IdAndProduct_Id(storeId, productId)
                    .orElse(null);
            if (inv == null) {
                // Product or inventory row may have been deleted in the meantime;
                // we don't fail the cancel for that — log and move on.
                log.warn("  ⚠ cannot return stock: no inventory row for product={} in store={}",
                        productId, storeId);
                continue;
            }
            int oldQty = inv.getQuantity();
            inv.setQuantity(oldQty + item.getQuantity());
            inventoryRepo.save(inv);
            log.debug("  stock returned: product={}, {} → {}",
                    item.getProduct().getTitle(), oldQty, inv.getQuantity());
        }
    }

    private OrderResponse toOrderResponse(Order order) {
        return new OrderResponse(
                order.getId(),
                order.getStore().getId(),
                order.getStatus().name(),
                order.getTotalAmount(),
                order.getCreatedAt()
        );
    }
}