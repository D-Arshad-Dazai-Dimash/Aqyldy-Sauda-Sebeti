package com.darshad.project.notification;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/notifications")
@RequiredArgsConstructor
@Tag(name = "Notifications", description = "User notifications inbox")
@SecurityRequirement(name = "bearerAuth")
public class NotificationController {

    private final NotificationService notificationService;

    @GetMapping
    @Operation(summary = "List notifications", description = "Returns paginated notifications for current user.")
    public NotificationPageDto getNotifications(
            Authentication auth,
            @RequestParam(defaultValue = "20") int limit,
            @RequestParam(defaultValue = "0") int offset
    ) {
        return notificationService.getNotifications(auth.getName(), limit, offset);
    }

    @GetMapping("/unread")
    @Operation(summary = "List unread notifications", description = "Returns unread notifications for current user.")
    public UnreadNotificationsDto getUnread(Authentication auth) {
        return notificationService.getUnread(auth.getName());
    }

    @GetMapping("/unread/count")
    @Operation(summary = "Unread count", description = "Returns number of unread notifications.")
    public Map<String, Integer> getUnreadCount(Authentication auth) {
        return Map.of("count", notificationService.getUnreadCount(auth.getName()));
    }

    @PutMapping("/{notificationId}/read")
    @Operation(summary = "Mark as read", description = "Marks one notification as read.")
    public ResponseEntity<Void> markAsRead(
            Authentication auth,
            @PathVariable UUID notificationId
    ) {
        notificationService.markAsRead(auth.getName(), notificationId);
        return ResponseEntity.noContent().build();
    }

    @PutMapping("/read-all")
    @Operation(summary = "Mark all as read", description = "Marks all unread notifications as read.")
    public ResponseEntity<Void> markAllAsRead(Authentication auth) {
        notificationService.markAllAsRead(auth.getName());
        return ResponseEntity.noContent().build();
    }

    @DeleteMapping("/{notificationId}")
    @Operation(summary = "Delete notification", description = "Deletes one notification from current user inbox.")
    public ResponseEntity<Void> deleteOne(
            Authentication auth,
            @PathVariable UUID notificationId
    ) {
        notificationService.deleteOne(auth.getName(), notificationId);
        return ResponseEntity.noContent().build();
    }

    @DeleteMapping
    @Operation(summary = "Delete all notifications", description = "Deletes all notifications for current user.")
    public ResponseEntity<Void> deleteAll(Authentication auth) {
        notificationService.deleteAll(auth.getName());
        return ResponseEntity.noContent().build();
    }
}
