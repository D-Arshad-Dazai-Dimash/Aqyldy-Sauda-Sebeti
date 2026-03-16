package com.darshad.project.scan.dto;

import java.util.UUID;

public record ScanRequest(
        UUID storeId,
        String barcode
) {}