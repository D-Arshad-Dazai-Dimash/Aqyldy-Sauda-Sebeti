package com.darshad.project.cart;

import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;
import java.util.UUID;

public interface CartRepository extends JpaRepository<Cart, UUID> {

    @EntityGraph(attributePaths = {"items", "items.product", "items.product.categories"})
    Optional<Cart> findByUserId(UUID userId);

    boolean existsByUserId(UUID userId);
}