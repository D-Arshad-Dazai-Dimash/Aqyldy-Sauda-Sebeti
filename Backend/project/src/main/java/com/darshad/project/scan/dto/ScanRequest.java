package com.darshad.project.scan.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

import java.util.UUID;

public record ScanRequest(
        @NotNull UUID storeId,
        @NotBlank String barcode
) {}