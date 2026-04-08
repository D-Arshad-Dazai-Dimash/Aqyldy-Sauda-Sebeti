package com.darshad.project.catalog.pricehistory;

import com.darshad.project.catalog.pricehistory.dto.PriceInsightDto;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

@RestController
@RequestMapping("/api/price-insights")
@RequiredArgsConstructor
public class PriceInsightController {

    private final PriceInsightService priceInsightService;

    /** Price insight for a specific product: trend, avg, good deal flag. */
    @GetMapping("/{productId}")
    public PriceInsightDto getInsight(@PathVariable UUID productId) {
        return priceInsightService.getInsight(productId);
    }
}
