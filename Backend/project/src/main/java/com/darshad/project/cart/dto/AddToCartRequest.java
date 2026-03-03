package com.darshad.project.cart.dto;

import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;

import java.util.UUID;

public record AddToCartRequest(
        @NotNull UUID productId,
        @Positive int quantity
) {}