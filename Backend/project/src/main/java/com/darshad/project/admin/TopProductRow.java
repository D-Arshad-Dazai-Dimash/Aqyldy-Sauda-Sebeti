package com.darshad.project.admin;

import java.math.BigDecimal;
import java.util.UUID;

/** Projection used by OrderRepository.findTopProductsByStore JPQL query. */
public record TopProductRow(UUID productId, String title, Long soldQty, BigDecimal revenue) {}
