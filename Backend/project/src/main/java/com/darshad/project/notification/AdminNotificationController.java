package com.darshad.project.notification;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.Map;

@PreAuthorize("hasRole('ADMIN')")
@RestController
@RequestMapping("/api/admin/notifications")
@RequiredArgsConstructor
@Tag(name = "Admin Notifications", description = "Admin broadcast and notification management")
@SecurityRequirement(name = "bearerAuth")
public class AdminNotificationController {

    private final NotificationService notificationService;

    @PostMapping("/promotions")
    @Operation(summary = "Broadcast promotion", description = "Sends a promotion notification to all active USER accounts.")
    public Map<String, Integer> sendPromotion(@Valid @RequestBody PromotionRequest req) {
        int sent = notificationService.sendPromotionToAllUsers(
                req.title().trim(),
                req.message().trim(),
                req.data()
        );
        return Map.of("sent", sent);
    }

    public record PromotionRequest(
            @NotBlank String title,
            @NotBlank String message,
            Map<String, Object> data
    ) {}
}
