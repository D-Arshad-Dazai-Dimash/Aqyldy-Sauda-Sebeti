package com.darshad.project.analytics;

import com.darshad.project.analytics.dto.SpendingAnalyticsDto;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/analytics")
@RequiredArgsConstructor
public class AnalyticsController {

    private final AnalyticsService analyticsService;

    /** Full spending analytics with ML-based prediction for the authenticated user. */
    @GetMapping("/spending")
    public SpendingAnalyticsDto getSpendingAnalytics(Authentication auth) {
        return analyticsService.getSpendingAnalytics(auth.getName());
    }
}
