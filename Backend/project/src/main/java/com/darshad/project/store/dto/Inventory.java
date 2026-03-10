package com.darshad.project.store.dto;

import com.darshad.project.catalog.product.Product;
import com.darshad.project.store.InventoryId;
import com.darshad.project.store.Store;
import jakarta.persistence.*;
import lombok.*;

import java.time.OffsetDateTime;

@Entity
@Table(name = "inventory")
@Getter @Setter
@NoArgsConstructor @AllArgsConstructor
@Builder
public class Inventory {

    @EmbeddedId
    private InventoryId id;

    @ManyToOne(optional = false, fetch = FetchType.LAZY)
    @MapsId("storeId")
    @JoinColumn(name = "store_id", nullable = false)
    private Store store;

    @ManyToOne(optional = false, fetch = FetchType.LAZY)
    @MapsId("productId")
    @JoinColumn(name = "product_id", nullable = false)
    private Product product;

    @Column(nullable = false)
    private int quantity;

    private OffsetDateTime updatedAt;

    @PrePersist
    void prePersist() {
        updatedAt = OffsetDateTime.now();
        if (id == null && store != null && product != null) {
            id = new InventoryId(store.getId(), product.getId());
        }
    }

    @PreUpdate
    void preUpdate() {
        updatedAt = OffsetDateTime.now();
    }
}