package com.darshad.project.recommendation;

import com.darshad.project.recommendation.dto.RecommendedProductDto;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/recommendations")
@RequiredArgsConstructor
public class RecommendationController {

    private final RecommendationService recommendationService;

    /** Products frequently bought together with the given product. */
    @PreAuthorize("isAuthenticated()")
    @GetMapping("/together/{productId}")
    public List<RecommendedProductDto> frequentlyBoughtTogether(
            @PathVariable UUID productId,
            @RequestParam(defaultValue = "10") int limit) {
        return recommendationService.frequentlyBoughtTogether(productId, limit);
    }

    /** Personalized recommendations based on the user's purchase history. */
    @GetMapping("/personal")
    public List<RecommendedProductDto> personalizedForUser(
            Authentication auth,
            @RequestParam(defaultValue = "10") int limit) {
        return recommendationService.personalizedForUser(auth.getName(), limit);
    }

    /** Popular products across all users (cold-start fallback). */
    @PreAuthorize("isAuthenticated()")
    @GetMapping("/popular")
    public List<RecommendedProductDto> popular(
            @RequestParam(defaultValue = "10") int limit) {
        return recommendationService.popularProducts(limit);
    }
}
