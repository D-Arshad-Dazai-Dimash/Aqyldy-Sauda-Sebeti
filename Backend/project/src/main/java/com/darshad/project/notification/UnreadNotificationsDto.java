package com.darshad.project.notification;

import java.util.List;

public record UnreadNotificationsDto(
        int count,
        List<NotificationDto> notifications
) {}
