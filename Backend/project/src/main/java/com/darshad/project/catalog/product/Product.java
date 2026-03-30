package com.darshad.project.catalog.product;

import com.darshad.project.catalog.category.Category;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.UuidGenerator;

import java.math.BigDecimal;
import java.time.OffsetDateTime;
import java.util.HashSet;
import java.util.Set;
import java.util.UUID;
@Entity
@Table(name = "products")
@Getter @Setter
@NoArgsConstructor @AllArgsConstructor
@Builder
public class Product {

    @Id
    @GeneratedValue
    @UuidGenerator
    private UUID id;

    // ЖАҢА: Штрих-код өрісі (Сканер үшін ең маңыздысы)
    @Column(nullable = false, unique = true, length = 50)
    private String barcode;

    @Column(nullable = false, length = 180)
    private String title;

    @Column(columnDefinition = "text")
    private String description;

    @Column(nullable = false, precision = 12, scale = 2)
    private BigDecimal price;

<<<<<<< HEAD
    // Базадағы image_url бағанымен сәйкестендіру
    @Column(name = "image_url", columnDefinition = "text")
=======
    @Column(unique = true, length = 64)
    private String barcode;

    @Column(nullable = false)
    @Builder.Default
    private Integer stock = 0;

    @Column(precision = 5, scale = 2)
    private BigDecimal discount;

    @Column(columnDefinition = "text")
>>>>>>> 0d522b1bd6e38864b67ee0518f37010a1c892700
    private String imageUrl;

    // ЖАҢА: Қоймадағы саны
    @Column(nullable = false)
    @Builder.Default
    private Integer stock = 0;

    @Column(nullable = false)
    @Builder.Default
    private boolean active = true;

    @Column(nullable = false, updatable = false)
    private OffsetDateTime createdAt;

    private OffsetDateTime updatedAt;



    @ManyToMany(fetch = FetchType.LAZY)
    @JoinTable(
            name = "product_categories",
            joinColumns = @JoinColumn(name = "product_id"),
            inverseJoinColumns = @JoinColumn(name = "category_id")
    )
    @Builder.Default
    private Set<Category> categories = new HashSet<>();

    @PrePersist
    void prePersist() {
        createdAt = OffsetDateTime.now();
        if (stock == null) stock = 0; // Null болмауы үшін
    }

    @PreUpdate
    void preUpdate() {
        updatedAt = OffsetDateTime.now();
    }
}