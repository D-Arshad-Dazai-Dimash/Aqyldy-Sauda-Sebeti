package com.darshad.project.notification;

import java.time.Instant;
import java.util.Map;
import java.util.UUID;

public record NotificationDto(
        UUID id,
        UUID userId,
        String type,
        String title,
        String message,
        Map<String, Object> data,
        boolean read,
        Instant createdAt,
        Instant readAt
) {}
