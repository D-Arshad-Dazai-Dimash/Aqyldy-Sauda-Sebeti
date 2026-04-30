package com.darshad.project.catalog.product;

import java.util.UUID;

/**
 * One store that currently has stock for a given product.
 *
 * Used by the buyer scan / add-to-cart flow when the active store has no
 * inventory: the client offers the user a one-tap switch to a store that
 * actually carries the item.
 */
public record ProductStoreAvailabilityDto(
        UUID storeId,
        String storeName,
        String storeAddress,
        Double latitude,
        Double longitude,
        int quantity
) {
}
