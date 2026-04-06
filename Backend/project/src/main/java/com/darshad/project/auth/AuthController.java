package com.darshad.project.auth;

import com.darshad.project.auth.dto.AuthResponse;
import com.darshad.project.auth.dto.BusinessRegisterRequest;
import com.darshad.project.auth.dto.LoginRequest;
import com.darshad.project.auth.dto.RegisterRequest;
import jakarta.validation.Valid;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

    private final AuthService authService;

    public AuthController(AuthService authService) {
        this.authService = authService;
    }

    @PostMapping("/register")
    public AuthResponse register(@Valid @RequestBody RegisterRequest req) {
        return authService.register(req);
    }

    @PostMapping("/register/business")
    public AuthResponse registerBusiness(@Valid @RequestBody BusinessRegisterRequest req) {
        return authService.registerBusiness(req);
    }

    @PostMapping("/login")
    public AuthResponse login(@Valid @RequestBody LoginRequest req) {
        return authService.login(req);
    }
}