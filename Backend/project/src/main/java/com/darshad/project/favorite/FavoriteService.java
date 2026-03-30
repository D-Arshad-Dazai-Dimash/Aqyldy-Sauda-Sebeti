package com.darshad.project.favorite;

import com.darshad.project.catalog.product.Product;
import com.darshad.project.catalog.product.ProductRepository;
import com.darshad.project.user.User;
import com.darshad.project.user.UserRepository;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class FavoriteService {

    private static final Logger log = LoggerFactory.getLogger(FavoriteService.class);

    private final FavoriteRepository favoriteRepo;
    private final UserRepository userRepo;
    private final ProductRepository productRepo;

    @Transactional(readOnly = true)
    public List<FavoriteDto> getMyFavorites(String email) {
        var user = getUser(email);
        log.debug("▶ getMyFavorites: email={}", email);

        return favoriteRepo.findByUserIdOrderByCreatedAtDesc(user.getId())
                .stream()
                .map(f -> {
                    var p = f.getProduct();
                    return new FavoriteDto(
                            f.getId(),
                            p.getId(),
                            p.getTitle(),
                            p.getPrice(),
                            p.getDiscount(),
                            p.getImageUrl(),
                            p.isActive(),
                            f.getCreatedAt()
                    );
                })
                .toList();
    }

    @Transactional(readOnly = true)
    public List<UUID> getMyFavoriteIds(String email) {
        var user = getUser(email);
        return favoriteRepo.findProductIdsByUserId(user.getId());
    }

    @Transactional
    public FavoriteDto toggle(String email, UUID productId) {
        var user = getUser(email);
        var existing = favoriteRepo.findByUserIdAndProductId(user.getId(), productId);

        if (existing.isPresent()) {
            favoriteRepo.delete(existing.get());
            log.info("✓ UNFAVORITED: email={}, productId={}", email, productId);
            return null; // null means removed
        }

        var product = productRepo.findById(productId)
                .orElseThrow(() -> new IllegalStateException("Product not found"));

        var fav = Favorite.builder()
                .user(user)
                .product(product)
                .build();
        favoriteRepo.save(fav);
        log.info("✓ FAVORITED: email={}, product={}", email, product.getTitle());

        return new FavoriteDto(
                fav.getId(),
                product.getId(),
                product.getTitle(),
                product.getPrice(),
                product.getDiscount(),
                product.getImageUrl(),
                product.isActive(),
                fav.getCreatedAt()
        );
    }

    @Transactional
    public void remove(String email, UUID productId) {
        var user = getUser(email);
        favoriteRepo.deleteByUserIdAndProductId(user.getId(), productId);
        log.info("✓ FAVORITE REMOVED: email={}, productId={}", email, productId);
    }

    private User getUser(String email) {
        return userRepo.findByEmail(email)
                .orElseThrow(() -> new IllegalStateException("User not found"));
    }
}
