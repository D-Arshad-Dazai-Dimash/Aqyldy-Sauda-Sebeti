package com.darshad.project.auth;

import com.darshad.project.auth.dto.*;
import com.darshad.project.auth.jwt.JwtService;
import com.darshad.project.user.*;
import org.springframework.security.authentication.*;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

@Service
public class AuthService {

    private final UserRepository users;
    private final PasswordEncoder encoder;
    private final JwtService jwtService;
    private final AuthenticationManager authManager;

    public AuthService(UserRepository users, PasswordEncoder encoder, JwtService jwtService, AuthenticationManager authManager) {
        this.users = users;
        this.encoder = encoder;
        this.jwtService = jwtService;
        this.authManager = authManager;
    }

    public AuthResponse register(RegisterRequest req) {
        String email = req.email().trim().toLowerCase();

        if (users.existsByEmail(email)) {
            throw new IllegalArgumentException("Email already exists");
        }

        var user = User.builder()
                .email(email)
                .passwordHash(encoder.encode(req.password()))
                .role("USER")
                .enabled(true)
                .build();

        users.save(user);

        String token = jwtService.generateToken(user.getEmail(), user.getRole());
        return new AuthResponse(token, "Bearer");
    }

    public AuthResponse login(LoginRequest req) {
        String email = req.email().trim().toLowerCase();

        authManager.authenticate(
                new UsernamePasswordAuthenticationToken(email, req.password())
        );

        var user = users.findByEmail(email).orElseThrow(); // после auth уже должен быть
        String token = jwtService.generateToken(user.getEmail(), user.getRole());
        return new AuthResponse(token, "Bearer");
    }
}