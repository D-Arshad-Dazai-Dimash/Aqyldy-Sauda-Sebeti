package com.darshad.project.store;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.UuidGenerator;

import java.time.OffsetDateTime;
import java.util.UUID;

@Entity
@Table(name = "stores")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Store {

    @Id
    @GeneratedValue
    @UuidGenerator
    private UUID id;

    @Column(nullable = false, length = 200)
    private String name;

    @Column(length = 300)
    private String address;

    @Column(columnDefinition = "text")
    private String description;

    @Column(length = 20)
    private String phone;

    @Column(columnDefinition = "text")
    private String logoUrl;

    @Column(length = 100)
    private String workingHours;

    @Column(name = "owner_id")
    private UUID ownerId;

    @Column(length = 20)
    private String bin;

    @Column(nullable = false)
    @Builder.Default
    private boolean active = true;

    private Double latitude;

    private Double longitude;

    @Column(nullable = false)
    private OffsetDateTime createdAt;

    private OffsetDateTime updatedAt;

    public Store(UUID id) {
        this.id = id;
    }

    @PrePersist
    void prePersist() {
        createdAt = OffsetDateTime.now();
        active = true;
    }

    @PreUpdate
    void preUpdate() {
        updatedAt = OffsetDateTime.now();
    }
}
