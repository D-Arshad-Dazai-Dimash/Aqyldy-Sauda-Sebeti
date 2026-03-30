package com.darshad.project.user;

import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api")
@RequiredArgsConstructor
public class UserController {

    private static final Logger log = LoggerFactory.getLogger(UserController.class);

    private final UserRepository userRepository;

    @GetMapping("/me")
    public UserProfileDto me(Authentication auth) {
        log.debug("▶ GET /me for user={}", auth.getName());
        var user = userRepository.findByEmail(auth.getName())
                .orElseThrow(() -> new IllegalStateException("User not found"));
        return toDto(user);
    }

    @PutMapping("/me")
    public UserProfileDto updateProfile(Authentication auth, @RequestBody UpdateProfileRequest req) {
        log.info("▶ UPDATE profile for user={}", auth.getName());
        var user = userRepository.findByEmail(auth.getName())
                .orElseThrow(() -> new IllegalStateException("User not found"));

        if (req.name() != null) user.setName(req.name());
        if (req.phone() != null) user.setPhone(req.phone());
        if (req.avatarUrl() != null) user.setAvatarUrl(req.avatarUrl());

        userRepository.save(user);
        log.info("✓ profile UPDATED for user={}", auth.getName());
        return toDto(user);
    }

    @PreAuthorize("hasRole('ADMIN')")
    @GetMapping("/admin")
    public String admin() {
        return "Admin area";
    }

    private UserProfileDto toDto(User u) {
        return new UserProfileDto(
                u.getId(),
                u.getEmail(),
                u.getName(),
                u.getPhone(),
                u.getAvatarUrl(),
                u.getRole().name()
        );
    }
}
