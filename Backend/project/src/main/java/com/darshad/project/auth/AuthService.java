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
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class AuthService {

    private static final Logger log = LoggerFactory.getLogger(AuthService.class);

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;
    private final StoreRepository storeRepository;

    public AuthService(UserRepository userRepository, PasswordEncoder passwordEncoder,
                       JwtService jwtService, StoreRepository storeRepository) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
        this.jwtService = jwtService;
        this.storeRepository = storeRepository;
    }

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

        return new AuthResponse(token, "Bearer", user.getRole().name());
    }

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
        log.info("✓ LOGIN success: email={}, role={}", user.getEmail(), user.getRole());

        return new AuthResponse(token, "Bearer", user.getRole().name());
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
                .role(Role.ADMIN)
                .enabled(true)
                .build();

        userRepository.save(user);

        Store store = Store.builder()
                .name(req.storeName().trim())
                .address(req.storeAddress())
                .phone(req.phone())
                .bin(req.bin())
                .workingHours(req.workingHours())
                .ownerId(user.getId())
                .active(true)
                .build();

        storeRepository.save(store);
        log.info("✓ REGISTER BUSINESS success: email={}, userId={}, storeId={}", email, user.getId(), store.getId());

        String token = jwtService.generateToken(user.getEmail(), user.getRole().name());

        return new AuthResponse(token, "Bearer", user.getRole().name());
    }
}