package com.darshad.project.notification;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.OffsetDateTime;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface NotificationRepository extends JpaRepository<Notification, UUID> {

    @Query(value = """
            SELECT *
            FROM notifications
            WHERE user_id = :userId
            ORDER BY created_at DESC
            LIMIT :limit OFFSET :offset
            """, nativeQuery = true)
    List<Notification> findPageByUserId(@Param("userId") UUID userId,
                                        @Param("limit") int limit,
                                        @Param("offset") int offset);

    long countByUser_Id(UUID userId);

    List<Notification> findByUser_IdAndReadFalseOrderByCreatedAtDesc(UUID userId);

    long countByUser_IdAndReadFalse(UUID userId);

    Optional<Notification> findByIdAndUser_Id(UUID id, UUID userId);

    @Modifying(clearAutomatically = true, flushAutomatically = true)
    @Query("""
            UPDATE Notification n
            SET n.read = true, n.readAt = :readAt
            WHERE n.user.id = :userId AND n.read = false
            """)
    int markAllAsRead(@Param("userId") UUID userId, @Param("readAt") OffsetDateTime readAt);

    long deleteByUser_Id(UUID userId);
}
