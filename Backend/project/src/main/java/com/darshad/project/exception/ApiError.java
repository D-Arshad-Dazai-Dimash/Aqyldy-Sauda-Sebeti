package com.darshad.project.exception;

import java.time.OffsetDateTime;

public record ApiError(
        int status,
        String error,
        String detail,
        OffsetDateTime timestamp
) {
    public static ApiError of(int status, String error, String detail) {
        return new ApiError(
                status,
                error,
                detail,
                OffsetDateTime.now()
        );
    }
}