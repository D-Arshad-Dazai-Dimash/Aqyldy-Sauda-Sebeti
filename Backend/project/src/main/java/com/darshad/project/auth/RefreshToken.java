package com.darshad.project.auth;

import com.darshad.project.user.User;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.UuidGenerator;

import java.time.OffsetDateTime;
import java.util.UUID;

/**
 * B11/B12: a long-lived refresh token tied to a single user.
 *
 * Stored as a sha256 hash, never as the raw token, so a database leak
 * does not directly hand out valid refresh credentials. The raw token
 * value is only ever returned to the client at issue time.
 *
 * Lifecycle:
 *   - issued on login/register
 *   - exchanged at /api/auth/refresh (returns a fresh access token,
 *     does not rotate the refresh token in this iteration)
 *   - revoked on logout (B12) or when the user resets their password
 *     (B13) — the row is kept (revoked=true) for audit
 */
@Entity
@Table(name = "refresh_tokens")
@Getter @Setter
@NoArgsConstructor @AllArgsConstructor
@Builder
public class RefreshToken {

    @Id
    @GeneratedValue
    @UuidGenerator
    private UUID id;

    @ManyToOne(optional = false, fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @Column(name = "token_hash", nullable = false, unique = true, length = 128)
    private String tokenHash;

    @Column(name = "expires_at", nullable = false)
    private OffsetDateTime expiresAt;

    @Builder.Default
    @Column(nullable = false)
    private boolean revoked = false;

    @Column(name = "created_at", nullable = false)
    private OffsetDateTime createdAt;

    @PrePersist
    void prePersist() {
        if (createdAt == null) createdAt = OffsetDateTime.now();
    }
}
