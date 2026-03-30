package com.darshad.project.auth;

import com.darshad.project.auth.dto.AuthResponse;
import com.darshad.project.auth.dto.LoginRequest;
import com.darshad.project.auth.dto.RegisterRequest;
import com.darshad.project.security.jwt.JwtService;
import com.darshad.project.user.Role;
import com.darshad.project.user.User;
import com.darshad.project.user.UserRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

@Service
public class AuthService {

    private static final Logger log = LoggerFactory.getLogger(AuthService.class);

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;

    public AuthService(UserRepository userRepository, PasswordEncoder passwordEncoder, JwtService jwtService) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
        this.jwtService = jwtService;
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
                .role(Role.USER)
                .enabled(true)
                .build();

        userRepository.save(user);
        log.info("✓ REGISTER success: email={}, id={}", user.getEmail(), user.getId());

        String token = jwtService.generateToken(user.getEmail(), user.getRole().name());

        return new AuthResponse(token, "Bearer");
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

        return new AuthResponse(token, "Bearer");
    }
}