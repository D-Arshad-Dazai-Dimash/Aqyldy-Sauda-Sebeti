package com.darshad.project.admin;

import lombok.RequiredArgsConstructor;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.UUID;

/**
 * ТЗ-13: Business analytics dashboard.
 *
 * GET /api/admin/stats?storeId=&from=yyyy-MM-dd&to=yyyy-MM-dd
 */
@PreAuthorize("hasAnyRole('ADMIN','MERCHANT')")
@RestController
@RequestMapping("/api/admin/stats")
@RequiredArgsConstructor
public class StatsController {

    private final StatsService statsService;

    @GetMapping
    public StatsResponse getStats(
            Authentication auth,
            @RequestParam UUID storeId,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate from,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate to
    ) {
        return statsService.getStatsForActor(auth.getName(), storeId, from, to);
    }
}
