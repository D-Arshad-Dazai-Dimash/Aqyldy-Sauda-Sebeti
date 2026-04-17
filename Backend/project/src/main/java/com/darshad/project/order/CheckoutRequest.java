package com.darshad.project.order;

import jakarta.validation.constraints.NotNull;
import java.util.UUID;

public record CheckoutRequest(
        @NotNull UUID storeId,
        @NotNull PaymentMethod paymentMethod,
        String cardLast4,
        String cardBrand,
        String comment
) {}