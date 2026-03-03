package com.darshad.project.store.dto;

import java.util.UUID;

public record StoreResponse(
        UUID id,
        String name,
        String address
) {}