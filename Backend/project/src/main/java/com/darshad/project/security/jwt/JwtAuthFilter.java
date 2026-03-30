package com.darshad.project.security.jwt;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpHeaders;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.List;

@Component
public class JwtAuthFilter extends OncePerRequestFilter {

    private static final Logger log = LoggerFactory.getLogger(JwtAuthFilter.class);

    private final JwtService jwtService;

    public JwtAuthFilter(JwtService jwtService) {
        this.jwtService = jwtService;
    }

    @Override
    protected void doFilterInternal(HttpServletRequest request,
                                    HttpServletResponse response,
                                    FilterChain filterChain) throws ServletException, IOException {

        String method = request.getMethod();
        String uri = request.getRequestURI();
        String header = request.getHeader(HttpHeaders.AUTHORIZATION);

        if (header == null || !header.startsWith("Bearer ")) {
            log.debug("→ {} {} (no token)", method, uri);
            filterChain.doFilter(request, response);
            return;
        }

        String token = header.substring(7);

        try {
            if (SecurityContextHolder.getContext().getAuthentication() == null) {

                String email = jwtService.extractEmail(token);
                String role = jwtService.extractRole(token);

                var auth = new UsernamePasswordAuthenticationToken(
                        email,
                        null,
                        role == null ? List.of() : List.of(new SimpleGrantedAuthority("ROLE_" + role))
                );

                SecurityContextHolder.getContext().setAuthentication(auth);
                log.debug("→ {} {} ✓ authenticated: email={}, role={}", method, uri, email, role);
            }
        } catch (io.jsonwebtoken.ExpiredJwtException e) {
            log.warn("→ {} {} ✗ token EXPIRED: {}", method, uri, e.getMessage());
            SecurityContextHolder.clearContext();
        } catch (io.jsonwebtoken.security.SignatureException e) {
            log.warn("→ {} {} ✗ token TAMPERED: {}", method, uri, e.getMessage());
            SecurityContextHolder.clearContext();
        } catch (Exception e) {
            log.warn("→ {} {} ✗ token INVALID: {} — {}", method, uri, e.getClass().getSimpleName(), e.getMessage());
            SecurityContextHolder.clearContext();
        }

        filterChain.doFilter(request, response);
    }
}