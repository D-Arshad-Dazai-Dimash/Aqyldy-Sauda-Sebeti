package com.darshad.project.notification;

import com.darshad.project.user.Role;
import com.darshad.project.user.User;
import com.darshad.project.user.UserRepository;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.OffsetDateTime;
import java.util.Collections;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class NotificationService {

    private static final Logger log = LoggerFactory.getLogger(NotificationService.class);
    private static final TypeReference<Map<String, Object>> MAP_TYPE = new TypeReference<>() {};

    private final UserRepository userRepository;
    private final NotificationRepository notificationRepository;
    private final ObjectMapper objectMapper;

    private UUID getUserIdByEmail(String email) {
        return userRepository.findByEmail(email)
                .orElseThrow(() -> new IllegalStateException("User not found"))
                .getId();
    }

    private NotificationDto toDto(Notification n) {
        return new NotificationDto(
                n.getId(),
                n.getUser().getId(),
                n.getType().name(),
                n.getTitle(),
                n.getMessage(),
                parseData(n.getDataJson()),
                n.isRead(),
                n.getCreatedAt() == null ? null : n.getCreatedAt().toInstant(),
                n.getReadAt() == null ? null : n.getReadAt().toInstant()
        );
    }

    private Map<String, Object> parseData(String dataJson) {
        if (dataJson == null || dataJson.isBlank()) {
            return null;
        }
        try {
            return objectMapper.readValue(dataJson, MAP_TYPE);
        } catch (Exception ex) {
            log.warn("Failed to parse notification data_json, returning empty object", ex);
            return Collections.emptyMap();
        }
    }

    private String toJson(Map<String, Object> data) {
        if (data == null || data.isEmpty()) {
            return null;
        }
        try {
            return objectMapper.writeValueAsString(data);
        } catch (Exception ex) {
            log.warn("Failed to serialize notification data map, storing null", ex);
            return null;
        }
    }

    private User getUserByEmail(String email) {
        return userRepository.findByEmail(email)
                .orElseThrow(() -> new IllegalStateException("User not found"));
    }

    @Transactional(readOnly = true)
    public NotificationPageDto getNotifications(String email, int limit, int offset) {
        UUID userId = getUserIdByEmail(email);
        int safeLimit = Math.max(1, limit);
        int safeOffset = Math.max(0, offset);

        List<NotificationDto> content = notificationRepository
                .findPageByUserId(userId, safeLimit, safeOffset)
                .stream()
                .map(this::toDto)
                .toList();

        long total = notificationRepository.countByUser_Id(userId);
        int totalPages = (int) Math.ceil((double) total / safeLimit);
        int pageNumber = safeOffset / safeLimit;

        return new NotificationPageDto(
                content,
                total,
                totalPages,
                pageNumber,
                safeLimit,
                pageNumber == 0,
                pageNumber >= Math.max(0, totalPages - 1)
        );
    }

    @Transactional(readOnly = true)
    public UnreadNotificationsDto getUnread(String email) {
        UUID userId = getUserIdByEmail(email);
        List<NotificationDto> unread = notificationRepository
                .findByUser_IdAndReadFalseOrderByCreatedAtDesc(userId)
                .stream()
                .map(this::toDto)
                .toList();

        return new UnreadNotificationsDto(unread.size(), unread);
    }

    @Transactional(readOnly = true)
    public int getUnreadCount(String email) {
        UUID userId = getUserIdByEmail(email);
        return (int) notificationRepository.countByUser_IdAndReadFalse(userId);
    }

    @Transactional
    public void markAsRead(String email, UUID notificationId) {
        UUID userId = getUserIdByEmail(email);
        var notification = notificationRepository.findByIdAndUser_Id(notificationId, userId)
                .orElse(null);
        if (notification == null || notification.isRead()) {
            return;
        }
        notification.setRead(true);
        notification.setReadAt(OffsetDateTime.now());
        notificationRepository.save(notification);
    }

    @Transactional
    public void markAllAsRead(String email) {
        UUID userId = getUserIdByEmail(email);
        notificationRepository.markAllAsRead(userId, OffsetDateTime.now());
    }

    @Transactional
    public void deleteOne(String email, UUID notificationId) {
        UUID userId = getUserIdByEmail(email);
        notificationRepository.findByIdAndUser_Id(notificationId, userId)
                .ifPresent(notificationRepository::delete);
    }

    @Transactional
    public void deleteAll(String email) {
        UUID userId = getUserIdByEmail(email);
        notificationRepository.deleteByUser_Id(userId);
    }

    @Transactional
    public NotificationDto createForUserId(UUID userId,
                                           NotificationType type,
                                           String title,
                                           String message,
                                           Map<String, Object> data) {
        var userRef = userRepository.getReferenceById(userId);
        Notification created = notificationRepository.save(
                Notification.builder()
                        .user(userRef)
                        .type(type)
                        .title(title)
                        .message(message)
                        .dataJson(toJson(data))
                        .read(false)
                        .build()
        );
        return toDto(created);
    }

    @Transactional
    public NotificationDto createForUserEmail(String email,
                                              NotificationType type,
                                              String title,
                                              String message,
                                              Map<String, Object> data) {
        User user = getUserByEmail(email);
        return createForUserId(user.getId(), type, title, message, data);
    }

    @Transactional
    public int sendPromotionToAllUsers(String title,
                                       String message,
                                       Map<String, Object> data) {
        List<User> recipients = userRepository.findByRoleAndEnabledTrue(Role.USER);
        if (recipients.isEmpty()) {
            return 0;
        }

        String dataJson = toJson(data);
        var batch = recipients.stream()
                .map(u -> Notification.builder()
                        .user(u)
                        .type(NotificationType.PROMOTION)
                        .title(title)
                        .message(message)
                        .dataJson(dataJson)
                        .read(false)
                        .build())
                .toList();

        notificationRepository.saveAll(batch);
        return batch.size();
    }

    @Transactional(readOnly = true)
    public List<NotificationDto> getRecentForUser(String email, int limit) {
        UUID userId = getUserIdByEmail(email);
        int safeLimit = Math.max(1, limit);
        return notificationRepository
                .findPageByUserId(userId, safeLimit, 0)
                .stream()
                .map(this::toDto)
                .toList();
    }
}
