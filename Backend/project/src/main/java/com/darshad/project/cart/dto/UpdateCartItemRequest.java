package com.darshad.project.cart.dto;

import jakarta.validation.constraints.Positive;

public record UpdateCartItemRequest(
        @Positive int quantity
) {}