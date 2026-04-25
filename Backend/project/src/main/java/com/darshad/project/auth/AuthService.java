package com.darshad.project.auth;

import com.darshad.project.auth.dto.AuthResponse;
import com.darshad.project.auth.dto.BusinessRegisterRequest;
import com.darshad.project.auth.dto.LoginRequest;
import com.darshad.project.auth.dto.RegisterRequest;
import com.darshad.project.security.jwt.JwtService;
import com.darshad.project.store.Store;
import com.darshad.project.store.StoreRepository;
import com.darshad.project.user.Role;
import com.darshad.project.user.User;
import com.darshad.project.user.UserRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.security.SecureRandom;
import java.time.OffsetDateTime;
import java.util.Base64;

@Service
public class AuthService {

    private static final Logger log = LoggerFactory.getLogger(AuthService.class);

    private static final SecureRandom RNG = new SecureRandom();

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;
    private final StoreRepository storeRepository;
    private final RefreshTokenRepository refreshTokenRepository;
    private final PasswordResetTokenRepository passwordResetTokenRepository;
    private final long refreshTtlDays;
    private final long passwordResetTtlMinutes;

    public AuthService(UserRepository userRepository, PasswordEncoder passwordEncoder,
                       JwtService jwtService, StoreRepository storeRepository,
                       RefreshTokenRepository refreshTokenRepository,
                       PasswordResetTokenRepository passwordResetTokenRepository,
                       @Value("${app.jwt.refresh-ttl-days}") long refreshTtlDays,
                       @Value("${app.password-reset.ttl-minutes}") long passwordResetTtlMinutes) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
        this.jwtService = jwtService;
        this.storeRepository = storeRepository;
        this.refreshTokenRepository = refreshTokenRepository;
        this.passwordResetTokenRepository = passwordResetTokenRepository;
        this.refreshTtlDays = refreshTtlDays;
        this.passwordResetTtlMinutes = passwordResetTtlMinutes;
    }

    @Transactional
    public AuthResponse register(RegisterRequest req) {

        String email = req.email().toLowerCase();
        log.info("▶ REGISTER attempt: email={}", email);

        if (userRepository.existsByEmail(email)) {
            log.warn("✗ REGISTER failed: email already exists — {}", email);
            throw new IllegalArgumentException("Email already registered");
        }

        if (req.password().length() < 6) {
            log.warn("✗ REGISTER failed: password too short — {}", email);
            throw new IllegalArgumentException("Password too short");
        }

        User user = User.builder()
                .email(email)
                .passwordHash(passwordEncoder.encode(req.password()))
                .name(req.name() != null ? req.name().trim() : null)
                .role(Role.USER)
                .enabled(true)
                .build();

        userRepository.save(user);
        log.info("✓ REGISTER success: email={}, id={}", user.getEmail(), user.getId());

        String token = jwtService.generateToken(user.getEmail(), user.getRole().name());
        String refresh = issueRefreshToken(user);

        return new AuthResponse(token, "Bearer", user.getRole().name(), refresh);
    }

    @Transactional
    public AuthResponse login(LoginRequest req) {

        String email = req.email().toLowerCase();
        log.info("▶ LOGIN attempt: email={}", email);

        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> {
                    log.warn("✗ LOGIN failed: user not found — {}", email);
                    return new IllegalArgumentException("Invalid credentials");
                });

        if (!user.isEnabled()) {
            log.warn("✗ LOGIN failed: user disabled — {}", email);
            throw new IllegalArgumentException("User disabled");
        }

        if (!passwordEncoder.matches(req.password(), user.getPasswordHash())) {
            log.warn("✗ LOGIN failed: wrong password — {}", email);
            throw new IllegalArgumentException("Invalid credentials");
        }

        String token = jwtService.generateToken(user.getEmail(), user.getRole().name());
        String refresh = issueRefreshToken(user);
        log.info("✓ LOGIN success: email={}, role={}", user.getEmail(), user.getRole());

        return new AuthResponse(token, "Bearer", user.getRole().name(), refresh);
    }

    @Transactional
    public AuthResponse registerBusiness(BusinessRegisterRequest req) {

        String email = req.email().toLowerCase();
        log.info("▶ REGISTER BUSINESS attempt: email={}, store={}", email, req.storeName());

        if (userRepository.existsByEmail(email)) {
            log.warn("✗ REGISTER BUSINESS failed: email already exists — {}", email);
            throw new IllegalArgumentException("Email already registered");
        }

        if (req.password().length() < 6) {
            log.warn("✗ REGISTER BUSINESS failed: password too short — {}", email);
            throw new IllegalArgumentException("Password too short");
        }

        User user = User.builder()
                .email(email)
                .passwordHash(passwordEncoder.encode(req.password()))
                .name(req.name() != null ? req.name().trim() : null)
                .phone(req.phone())
            .role(Role.MERCHANT)
                .enabled(true)
                .build();

        userRepository.save(user);

        Store store = Store.builder()
            .name(req.storeName().trim())
            .address(req.storeAddress())
            .phone(req.phone())
            .bin(req.bin())
            .workingHours(req.workingHours())
            .latitude(req.latitude())
            .longitude(req.longitude())
            .ownerId(user.getId())
            .active(true)
            .build();

        storeRepository.save(store);
        log.info("✓ REGISTER BUSINESS success: email={}, userId={}, storeId={}", email, user.getId(), store.getId());

        String token = jwtService.generateToken(user.getEmail(), user.getRole().name());
        String refresh = issueRefreshToken(user);

        return new AuthResponse(token, "Bearer", user.getRole().name(), refresh);
    }

    // ===========================================================
    // B11: refresh token issue / exchange
    // ===========================================================

    /**
     * Issues a fresh refresh token for the given user. The raw token
     * is returned to the caller; only the sha256 hash is persisted, so
     * a DB dump cannot be replayed against /auth/refresh.
     */
    private String issueRefreshToken(User user) {
        byte[] raw = new byte[48];
        RNG.nextBytes(raw);
        String token = Base64.getUrlEncoder().withoutPadding().encodeToString(raw);

        RefreshToken entity = RefreshToken.builder()
                .user(user)
                .tokenHash(sha256(token))
                .expiresAt(OffsetDateTime.now().plusDays(refreshTtlDays))
                .revoked(false)
                .build();
        refreshTokenRepository.save(entity);

        log.debug("  issued refresh token: userId={}, expiresAt={}", user.getId(), entity.getExpiresAt());
        return token;
    }

    /**
     * B11: client exchanges a still-valid refresh token for a new
     * access token. The refresh token itself is NOT rotated here —
     * it remains valid until expiry or explicit logout. (Rotation
     * could be added later, but it requires the frontend to handle
     * a new refresh value on every call, which is a bigger change.)
     */
    @Transactional
    public AuthResponse refresh(String refreshTokenRaw) {
        log.info("▶ REFRESH attempt");

        if (refreshTokenRaw == null || refreshTokenRaw.isBlank()) {
            throw new IllegalArgumentException("Missing refresh token");
        }

        RefreshToken stored = refreshTokenRepository.findByTokenHash(sha256(refreshTokenRaw))
                .orElseThrow(() -> {
                    log.warn("✗ REFRESH failed: unknown token");
                    return new IllegalArgumentException("Invalid refresh token");
                });

        if (stored.isRevoked()) {
            log.warn("✗ REFRESH failed: token revoked, userId={}", stored.getUser().getId());
            throw new IllegalArgumentException("Refresh token revoked");
        }

        if (stored.getExpiresAt().isBefore(OffsetDateTime.now())) {
            log.warn("✗ REFRESH failed: token expired, userId={}", stored.getUser().getId());
            throw new IllegalArgumentException("Refresh token expired");
        }

        User user = stored.getUser();
        if (!user.isEnabled()) {
            throw new IllegalArgumentException("User disabled");
        }

        String access = jwtService.generateToken(user.getEmail(), user.getRole().name());
        log.info("✓ REFRESH success: userId={}", user.getId());
        return new AuthResponse(access, "Bearer", user.getRole().name(), refreshTokenRaw);
    }

    // ===========================================================
    // B12: logout (revoke refresh tokens)
    // ===========================================================

    /**
     * B12: revoke a single refresh token (the one the client just
     * presented). Idempotent — unknown / already-revoked tokens are
     * silently accepted so the client can always "log out" without
     * the server leaking which tokens existed.
     */
    @Transactional
    public void logout(String refreshTokenRaw) {
        log.info("▶ LOGOUT");
        if (refreshTokenRaw == null || refreshTokenRaw.isBlank()) {
            return;
        }
        refreshTokenRepository.findByTokenHash(sha256(refreshTokenRaw))
                .ifPresent(t -> {
                    if (!t.isRevoked()) {
                        t.setRevoked(true);
                        log.info("✓ LOGOUT: refresh token revoked, userId={}", t.getUser().getId());
                    }
                });
    }

    // ===========================================================
    // B13: password reset (forgot / reset)
    // ===========================================================

    /**
     * B13: starts the password reset flow. Generates a single-use
     * token tied to the user and returns it. In dev there is no
     * email transport, so the token is returned in the response —
     * the frontend (or a tester) can paste it into /reset-password.
     *
     * For an unknown email we return null (no token generated) but
     * also do not throw, so an attacker cannot enumerate valid
     * accounts via this endpoint.
     */
    @Transactional
    public String forgotPassword(String emailRaw) {
        String email = emailRaw == null ? "" : emailRaw.toLowerCase();
        log.info("▶ FORGOT PASSWORD: email={}", email);

        var maybeUser = userRepository.findByEmail(email);
        if (maybeUser.isEmpty()) {
            log.info("  (no such user — silently no-op to avoid enumeration)");
            return null;
        }
        User user = maybeUser.get();

        byte[] raw = new byte[36];
        RNG.nextBytes(raw);
        String token = Base64.getUrlEncoder().withoutPadding().encodeToString(raw);

        PasswordResetToken entity = PasswordResetToken.builder()
                .user(user)
                .tokenHash(sha256(token))
                .expiresAt(OffsetDateTime.now().plusMinutes(passwordResetTtlMinutes))
                .build();
        passwordResetTokenRepository.save(entity);

        log.info("✓ FORGOT PASSWORD: token issued, userId={}, ttlMin={}",
                user.getId(), passwordResetTtlMinutes);
        return token; // dev only — in prod this would go through email
    }

    /**
     * B13: consumes a reset token and sets the new password. Marks
     * the token as consumed so it cannot be replayed, and revokes
     * all of the user's outstanding refresh tokens so existing
     * sessions cannot keep going with the old credentials.
     */
    @Transactional
    public void resetPassword(String resetTokenRaw, String newPassword) {
        log.info("▶ RESET PASSWORD attempt");

        if (resetTokenRaw == null || resetTokenRaw.isBlank()) {
            throw new IllegalArgumentException("Missing reset token");
        }
        if (newPassword == null || newPassword.length() < 6) {
            throw new IllegalArgumentException("Password too short");
        }

        PasswordResetToken stored = passwordResetTokenRepository.findByTokenHash(sha256(resetTokenRaw))
                .orElseThrow(() -> {
                    log.warn("✗ RESET PASSWORD failed: unknown token");
                    return new IllegalArgumentException("Invalid reset token");
                });

        if (stored.getConsumedAt() != null) {
            log.warn("✗ RESET PASSWORD failed: token already used");
            throw new IllegalArgumentException("Reset token already used");
        }
        if (stored.getExpiresAt().isBefore(OffsetDateTime.now())) {
            log.warn("✗ RESET PASSWORD failed: token expired");
            throw new IllegalArgumentException("Reset token expired");
        }

        User user = stored.getUser();
        user.setPasswordHash(passwordEncoder.encode(newPassword));
        userRepository.save(user);

        stored.setConsumedAt(OffsetDateTime.now());

        // Kill existing sessions: any refresh token still floating around
        // for this user should no longer work after a password reset.
        int revoked = refreshTokenRepository.revokeAllForUser(user.getId());
        log.info("✓ RESET PASSWORD: userId={}, revokedRefreshTokens={}", user.getId(), revoked);
    }

    private static String sha256(String input) {
        try {
            MessageDigest md = MessageDigest.getInstance("SHA-256");
            byte[] hash = md.digest(input.getBytes(StandardCharsets.UTF_8));
            StringBuilder sb = new StringBuilder(hash.length * 2);
            for (byte b : hash) {
                sb.append(String.format("%02x", b));
            }
            return sb.toString();
        } catch (NoSuchAlgorithmException e) {
            throw new IllegalStateException("SHA-256 not available", e);
        }
    }
}