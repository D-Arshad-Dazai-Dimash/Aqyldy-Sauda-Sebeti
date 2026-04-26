package com.darshad.project.security;

import com.darshad.project.security.jwt.JwtAuthFilter;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.config.annotation.authentication.configuration.AuthenticationConfiguration;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

import java.util.Arrays;
import java.util.List;
import java.util.stream.Collectors;

@EnableMethodSecurity
@Configuration
public class SecurityConfig {

    @Value("${app.cors.allowed-origins:http://localhost:3000,http://localhost:8081,http://10.0.2.2:8080,http://localhost:19006}")
    private String corsAllowedOrigins;

    @Bean
    PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }

    @Bean
    CorsConfigurationSource corsConfigurationSource() {
        var config = new CorsConfiguration();
        // CORS is env-driven for cloud and mobile clients.
        List<String> origins = Arrays.stream(corsAllowedOrigins.split(","))
            .map(String::trim)
            .filter(s -> !s.isEmpty())
            .collect(Collectors.toList());

        config.setAllowedOriginPatterns(origins);
        config.setAllowedMethods(List.of("GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"));
        config.setAllowedHeaders(List.of("*"));
        config.setAllowCredentials(true);
        config.setMaxAge(3600L);

        var source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/api/**", config);
        return source;
    }

    @Bean
    SecurityFilterChain securityFilterChain(HttpSecurity http,
                                            JwtAuthFilter jwtAuthFilter,
                                            RateLimitFilter rateLimitFilter) throws Exception {
        return http
                .cors(cors -> cors.configurationSource(corsConfigurationSource()))
                .csrf(csrf -> csrf.disable())
                .sessionManagement(sm -> sm.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
                .authorizeHttpRequests(auth -> auth

                        // AUTH — logout requires a valid token; all other auth endpoints are public
                        .requestMatchers("/api/auth/logout").authenticated()
                        .requestMatchers("/api/auth/**").permitAll()

                        // SWAGGER
            .requestMatchers(
                "/v3/api-docs/**", "/swagger-ui/**", "/swagger-ui.html",
                "/swagger", "/swagger/**", "/api-docs/**"
            ).permitAll()

                        // Health and uptime checks
                        .requestMatchers(HttpMethod.GET, "/health", "/actuator/health").permitAll()

                        // STATIC UPLOADS (B8: product images served by WebConfig)
                        .requestMatchers(HttpMethod.GET, "/uploads/**").permitAll()

                        // PUBLIC CATALOG
                        .requestMatchers(HttpMethod.GET, "/api/categories", "/api/products/**").permitAll()

                        // PUBLIC STORES (individual store lookup is public; /my requires auth)
                        .requestMatchers(HttpMethod.GET, "/api/stores/my").authenticated()
                        .requestMatchers(HttpMethod.GET, "/api/stores/**").permitAll()

                        // SCAN (authenticated)
                        .requestMatchers("/api/scan/**").authenticated()

                        // BUSINESS SURFACE (admin + merchant)
                        .requestMatchers(
                            "/api/admin/products/**",
                            "/api/admin/inventory/**",
                            "/api/admin/orders/**",
                            "/api/admin/stats/**"
                        ).hasAnyRole("ADMIN", "MERCHANT")

                        // ADMIN
                        .requestMatchers("/api/admin/**").hasRole("ADMIN")

                        // USER API
                        .requestMatchers("/api/cart/**").authenticated()
                        .requestMatchers("/api/orders/**").authenticated()
                        .requestMatchers("/api/favorites/**").authenticated()
                        .requestMatchers("/api/me/**").authenticated()
                        .requestMatchers("/api/recommendations/**").authenticated()
                        .requestMatchers("/api/analytics/**").authenticated()
                        .requestMatchers("/api/price-insights/**").authenticated()

                        // EVERYTHING ELSE
                        .anyRequest().authenticated()
                )
                .addFilterBefore(rateLimitFilter, UsernamePasswordAuthenticationFilter.class)
                .addFilterBefore(jwtAuthFilter, UsernamePasswordAuthenticationFilter.class)
                .build();
    }

    @Bean
    AuthenticationManager authenticationManager(AuthenticationConfiguration cfg) throws Exception {
        return cfg.getAuthenticationManager();
    }
}