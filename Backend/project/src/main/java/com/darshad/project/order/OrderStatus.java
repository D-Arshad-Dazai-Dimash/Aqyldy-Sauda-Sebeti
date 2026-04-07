package com.darshad.project.order;

import java.util.EnumSet;
import java.util.Map;
import java.util.Set;

/**
 * Order lifecycle.
 *
 * <pre>
 *   CREATED ──► CONFIRMED ──► SHIPPED ──► DELIVERED
 *      │            │
 *      └────────────┴──► CANCELLED   (also from CREATED itself)
 * </pre>
 *
 * Notes on the choices here:
 *   - PAID is intentionally not part of the canonical happy path. We do
 *     not actually process payments today; the buyer simply checks out.
 *     PAID is kept in the enum so existing rows in dev databases that
 *     pre-date V6 still deserialize, but the state machine treats it as
 *     equivalent to CONFIRMED for transitions.
 *   - DELIVERED and CANCELLED are terminal.
 *   - Cancellation is only allowed up to and including CONFIRMED. Once
 *     a parcel has SHIPPED, the merchant cannot self-serve cancel — that
 *     would also need the inventory return logic to make sense, which
 *     gets ambiguous after the goods physically left the store.
 */
public enum OrderStatus {
    CREATED,
    PAID,        // legacy / equivalent to CONFIRMED
    CONFIRMED,
    SHIPPED,
    DELIVERED,
    CANCELLED;

    private static final Map<OrderStatus, Set<OrderStatus>> ALLOWED = Map.of(
            CREATED,   EnumSet.of(CONFIRMED, PAID, CANCELLED),
            PAID,      EnumSet.of(CONFIRMED, SHIPPED, CANCELLED),
            CONFIRMED, EnumSet.of(SHIPPED, CANCELLED),
            SHIPPED,   EnumSet.of(DELIVERED),
            DELIVERED, EnumSet.noneOf(OrderStatus.class),
            CANCELLED, EnumSet.noneOf(OrderStatus.class)
    );

    public boolean canTransitionTo(OrderStatus next) {
        return ALLOWED.getOrDefault(this, EnumSet.noneOf(OrderStatus.class)).contains(next);
    }

    public boolean isTerminal() {
        return this == DELIVERED || this == CANCELLED;
    }
}
