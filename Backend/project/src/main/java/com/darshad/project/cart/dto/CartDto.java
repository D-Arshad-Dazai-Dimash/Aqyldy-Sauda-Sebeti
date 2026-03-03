package com.darshad.project.cart.dto;

import java.math.BigDecimal;
import java.util.List;
import java.util.UUID;

public record CartDto(
        UUID cartId,
        List<CartItemDto> items,
        BigDecimal total
) {}