package com.darshad.project.auth;

import com.darshad.project.user.UserRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.*;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class CustomUserDetailsService implements UserDetailsService {

    private static final Logger log = LoggerFactory.getLogger(CustomUserDetailsService.class);

    private final UserRepository users;

    public CustomUserDetailsService(UserRepository users) {
        this.users = users;
    }

    @Override
    public UserDetails loadUserByUsername(String email) throws UsernameNotFoundException {
        log.debug("▶ loadUserByUsername: {}", email);
        var user = users.findByEmail(email)
                .orElseThrow(() -> {
                    log.warn("  ✗ user not found: {}", email);
                    return new UsernameNotFoundException("User not found");
                });
        log.debug("  ✓ user loaded: email={}, role={}, enabled={}", user.getEmail(), user.getRole(), user.isEnabled());
        return new org.springframework.security.core.userdetails.User(
                user.getEmail(),
                user.getPasswordHash(),
                user.isEnabled(),
                true, true, true,
                List.of(new SimpleGrantedAuthority("ROLE_" + user.getRole().name()))
        );
    }
}