package com.darshad.project.favorite;

import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/favorites")
@RequiredArgsConstructor
public class FavoriteController {

    private final FavoriteService favoriteService;

    /** Get all favorites with product details */
    @GetMapping
    public List<FavoriteDto> getMyFavorites(Authentication auth) {
        return favoriteService.getMyFavorites(auth.getName());
    }

    /** Get just the product IDs (lightweight, for heart icons) */
    @GetMapping("/ids")
    public List<UUID> getMyFavoriteIds(Authentication auth) {
        return favoriteService.getMyFavoriteIds(auth.getName());
    }

    /** Toggle favorite: adds if not exists, removes if exists */
    @PostMapping("/{productId}")
    public ResponseEntity<FavoriteDto> toggle(@PathVariable UUID productId, Authentication auth) {
        var result = favoriteService.toggle(auth.getName(), productId);
        if (result == null) {
            return ResponseEntity.noContent().build(); // 204 = removed
        }
        return ResponseEntity.ok(result); // 200 = added
    }

    /** Explicitly remove a favorite */
    @DeleteMapping("/{productId}")
    public ResponseEntity<Void> remove(@PathVariable UUID productId, Authentication auth) {
        favoriteService.remove(auth.getName(), productId);
        return ResponseEntity.noContent().build();
    }
}
