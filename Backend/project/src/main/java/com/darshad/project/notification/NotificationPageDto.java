package com.darshad.project.notification;

import java.util.List;

public record NotificationPageDto(
        List<NotificationDto> content,
        long totalElements,
        int totalPages,
        int number,
        int size,
        boolean first,
        boolean last
) {}
