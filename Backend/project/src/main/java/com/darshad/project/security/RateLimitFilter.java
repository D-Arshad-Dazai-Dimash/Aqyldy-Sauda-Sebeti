package com.darshad.project.security;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.Set;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.atomic.AtomicInteger;

/**
 * B10: Per-IP fixed-window rate limiter for the auth endpoints.
 *
 * Why a homegrown filter and not Bucket4j: adding a new dependency
 * needs team coordination (CLAUDE/dev rule from the user — do not
 * touch deps), and the auth surface is small enough that a window
 * counter is fine. The window resets every {@code window-seconds};
 * within a window each remote IP gets at most {@code max-requests}
 * hits across {@code /api/auth/login} and {@code /api/auth/register}.
 *
 * Limitations to be aware of:
 *   - In-memory only. Multi-instance deployments will need a shared
 *     store (Redis) or sticky routing for the limit to be global.
 *   - Counts trust the remote address. If the app sits behind a
 *     proxy, configure {@code server.forward-headers-strategy=NATIVE}
 *     so {@code request.getRemoteAddr()} is the real client IP.
 *   - Not exempt for tests; tests can disable by hitting other
 *     endpoints or by raising the limit via env override.
 */
@Component
public class RateLimitFilter extends OncePerRequestFilter {

    private static final Logger log = LoggerFactory.getLogger(RateLimitFilter.class);

    private static final Set<String> LIMITED_PATHS = Set.of(
            "/api/auth/login",
            "/api/auth/register",
            "/api/auth/register/business",
            "/api/auth/forgot-password",
            "/api/auth/reset-password"
    );

    private final long windowMillis;
    private final int maxRequests;

    private final ConcurrentHashMap<String, Window> windows = new ConcurrentHashMap<>();

    public RateLimitFilter(
            @Value("${app.rate-limit.window-seconds}") long windowSeconds,
            @Value("${app.rate-limit.max-requests}") int maxRequests
    ) {
        this.windowMillis = windowSeconds * 1000L;
        this.maxRequests = maxRequests;
        log.info("RateLimitFilter initialized: window={}s, max={}", windowSeconds, maxRequests);
    }

    @Override
    protected void doFilterInternal(HttpServletRequest request,
                                    HttpServletResponse response,
                                    FilterChain chain) throws ServletException, IOException {

        String path = request.getRequestURI();
        if (!LIMITED_PATHS.contains(path)) {
            chain.doFilter(request, response);
            return;
        }

        String ip = request.getRemoteAddr();
        if (ip == null) ip = "unknown";
        String key = ip + "|" + path;

        long now = System.currentTimeMillis();
        Window w = windows.compute(key, (k, existing) -> {
            if (existing == null || now - existing.startedAt >= windowMillis) {
                return new Window(now);
            }
            return existing;
        });

        int count = w.count.incrementAndGet();
        if (count > maxRequests) {
            log.warn("✗ RATE LIMIT: ip={}, path={}, count={}", ip, path, count);
            response.setStatus(429);
            response.setHeader("Retry-After", String.valueOf(
                    Math.max(1, (windowMillis - (now - w.startedAt)) / 1000)));
            response.setContentType("application/json");
            response.getWriter().write("{\"error\":\"Too many requests\"}");
            return;
        }

        chain.doFilter(request, response);
    }

    private static final class Window {
        final long startedAt;
        final AtomicInteger count = new AtomicInteger(0);
        Window(long startedAt) { this.startedAt = startedAt; }
    }
}
