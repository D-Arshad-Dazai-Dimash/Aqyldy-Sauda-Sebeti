package com.darshad.project.security;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.core.Ordered;
import org.springframework.core.annotation.Order;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;

/**
 * Logs every HTTP request with method, URI, status, and duration.
 * Runs FIRST in the filter chain so it wraps everything.
 */
@Component
@Order(Ordered.HIGHEST_PRECEDENCE)
public class RequestLoggingFilter extends OncePerRequestFilter {

    private static final Logger log = LoggerFactory.getLogger(RequestLoggingFilter.class);

    @Override
    protected void doFilterInternal(HttpServletRequest request,
                                    HttpServletResponse response,
                                    FilterChain filterChain) throws ServletException, IOException {

        // Skip static resources and actuator noise
        String uri = request.getRequestURI();
        if (uri.startsWith("/swagger") || uri.startsWith("/v3/api-docs") || uri.contains("favicon")) {
            filterChain.doFilter(request, response);
            return;
        }

        long start = System.currentTimeMillis();
        String method = request.getMethod();
        String query = request.getQueryString();
        String fullPath = query != null ? uri + "?" + query : uri;

        try {
            filterChain.doFilter(request, response);
        } finally {
            long duration = System.currentTimeMillis() - start;
            int status = response.getStatus();

            if (status >= 500) {
                log.error("← {} {} → {} ({}ms)", method, fullPath, status, duration);
            } else if (status >= 400) {
                log.warn("← {} {} → {} ({}ms)", method, fullPath, status, duration);
            } else {
                log.info("← {} {} → {} ({}ms)", method, fullPath, status, duration);
            }
        }
    }
}
