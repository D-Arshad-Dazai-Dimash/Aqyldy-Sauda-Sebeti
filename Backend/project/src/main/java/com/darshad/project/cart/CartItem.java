package com.darshad.project.cart;

import com.darshad.project.catalog.product.Product;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.UuidGenerator;

import java.math.BigDecimal;
import java.time.OffsetDateTime;
import java.util.UUID;

@Entity
@Table(name = "cart_items",
        uniqueConstraints = @UniqueConstraint(name="uq_cart_product", columnNames = {"cart_id","product_id"}))
@Getter @Setter
@NoArgsConstructor @AllArgsConstructor
@Builder
public class CartItem {

    @Id
    @GeneratedValue
    @UuidGenerator
    private UUID id;

    @ManyToOne(optional = false)
    @JoinColumn(name = "cart_id", nullable = false)
    private Cart cart;

    @ManyToOne(optional = false)
    @JoinColumn(name = "product_id", nullable = false)
    private Product product;

    @Column(nullable = false)
    private int quantity;

    /**
     * Effective unit price snapshotted at the moment the item was added
     * (= product.price * (1 - discount/100), see {@code CartService.effectivePrice}).
     * Frozen so that a merchant price change between "add to cart" and
     * "checkout" cannot silently change the cart total under the user.
     * Nullable for legacy rows written before V6 — code that reads this
     * must fall back to the live product price if null.
     */
    @Column(precision = 12, scale = 2)
    private BigDecimal price;

    @Column(nullable = false)
    private OffsetDateTime createdAt;

    private OffsetDateTime updatedAt;

    @PrePersist
    void prePersist() {
        createdAt = OffsetDateTime.now();
    }

    @PreUpdate
    void preUpdate() {
        updatedAt = OffsetDateTime.now();
    }
}