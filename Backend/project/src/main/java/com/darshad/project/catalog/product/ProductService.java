package com.darshad.project.catalog.product;

import com.darshad.project.catalog.category.Category;
import com.darshad.project.catalog.category.CategoryRepository;
import com.darshad.project.catalog.pricehistory.PriceHistory;
import com.darshad.project.catalog.pricehistory.PriceHistoryRepository;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.cache.annotation.CacheEvict;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.util.HashMap;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.UUID;

@Service
public class ProductService {

    private static final Logger log = LoggerFactory.getLogger(ProductService.class);
    private static final Set<String> ALLOWED_IMAGE_TYPES = Set.of(
            "image/jpeg", "image/png", "image/webp", "image/gif"
    );
    private static final long MAX_IMAGE_BYTES = 5L * 1024 * 1024; // 5 MB

    private final ProductRepository productRepo;
    private final CategoryRepository categoryRepo;
    private final PriceHistoryRepository priceHistoryRepo;
    private final String uploadsDir;
    private final String publicBaseUrl;

    public ProductService(
            ProductRepository productRepo,
            CategoryRepository categoryRepo,
            PriceHistoryRepository priceHistoryRepo,
            @Value("${app.uploads.dir}") String uploadsDir,
            @Value("${app.uploads.public-base-url}") String publicBaseUrl
    ) {
        this.productRepo = productRepo;
        this.categoryRepo = categoryRepo;
        this.priceHistoryRepo = priceHistoryRepo;
        this.uploadsDir = uploadsDir;
        this.publicBaseUrl = publicBaseUrl;
    }

    @Transactional(readOnly = true)
    public Page<ProductDto> search(String q, UUID categoryId, Boolean active, Pageable pageable) {

        log.debug("▶ product search: q={}, categoryId={}, active={}, page={}", q, categoryId, active, pageable);

        Specification<Product> spec = (root, query, cb) -> cb.conjunction();

        if (q != null && !q.isBlank()) {
            spec = spec.and(ProductSpecs.search(q));
        }

        if (categoryId != null) {
            spec = spec.and(ProductSpecs.inCategory(categoryId));
        }

        if (active != null) {
            spec = spec.and(ProductSpecs.isActive(active));
        }

        var result = productRepo.findAll(spec, pageable)
                .map(this::toDto);
        log.debug("  found {} products (page {}/{})", result.getNumberOfElements(), result.getNumber(), result.getTotalPages());
        return result;
    }

    @Transactional(readOnly = true)
    public ProductDto get(UUID id) {
        log.debug("▶ get product: id={}", id);
        return productRepo.findById(id)
                .map(this::toDto)
                .orElseThrow(() -> new IllegalStateException("Product not found"));
    }

    @Transactional
    public ProductDto create(ProductUpsertRequest req) {
        log.info("▶ CREATE product: title={}, barcode={}, price={}", req.title(), req.barcode(), req.price());
        var p = Product.builder()
                .title(req.title())
                .description(req.description())
                .price(req.price())
                .barcode(req.barcode())
                .stock(req.stock() == null ? 0 : req.stock())
                .discount(req.discount())
                .imageUrl(req.imageUrl())
                .unit(req.unit())
                .weight(req.weight())
                .active(req.active() == null || req.active())
                .build();

        applyCategories(p, req);
        var saved = productRepo.save(p);
        log.info("✓ product CREATED: id={}, title={}", saved.getId(), saved.getTitle());
        return toDto(saved);
    }

    @CacheEvict(value = "price-insights", key = "#id")
    @Transactional
    public ProductDto update(UUID id, ProductUpsertRequest req) {
        log.info("▶ UPDATE product: id={}, title={}", id, req.title());
        var p = productRepo.findById(id)
                .orElseThrow(() -> new IllegalStateException("Product not found"));
        p.setBarcode(req.barcode());

        if (req.stock() != null)
            p.setStock(req.stock());

        p.setDiscount(req.discount());
        p.setTitle(req.title());
        p.setDescription(req.description());

        // Track price changes
        if (req.price() != null && p.getPrice() != null
                && req.price().compareTo(p.getPrice()) != 0) {
            log.info("  price change detected: {} → {}", p.getPrice(), req.price());
            priceHistoryRepo.save(PriceHistory.builder()
                    .product(p)
                    .oldPrice(p.getPrice())
                    .newPrice(req.price())
                    .build());
        }
        p.setPrice(req.price());

        p.setImageUrl(req.imageUrl());
        p.setUnit(req.unit());
        p.setWeight(req.weight());
        if (req.active() != null) p.setActive(req.active());

        applyCategories(p, req);
        log.info("✓ product UPDATED: id={}, title={}", p.getId(), p.getTitle());
        return toDto(p);
    }

    @Transactional
    public void delete(UUID id) {
        log.info("▶ DELETE product: id={}", id);
        productRepo.deleteById(id);
        log.info("✓ product DELETED: id={}", id);
    }

    private void applyCategories(Product p, ProductUpsertRequest req) {
        if (req.categoryIds() == null) return;

        var set = new HashSet<>(categoryRepo.findAllById(req.categoryIds()));
        if (set.size() != req.categoryIds().size()) {
            throw new IllegalStateException("Some categories not found");
        }
        p.setCategories(set);
    }

    private ProductDto toDto(Product p) {
        return new ProductDto(
                p.getId(),
                p.getTitle(),
                p.getDescription(),
                p.getPrice(),
                p.getBarcode(),
                p.getStock(),
                p.getDiscount(),
                p.getImageUrl(),
                p.getUnit(),
                p.getWeight(),
                p.isActive(),
                p.getCategories().stream().map(Category::getId).toList()
        );
    }

    /**
     * B8: Stores the uploaded image to the local uploads directory and
     * persists the public URL on the product. Validates content-type and
     * size up front. Filename is randomized so a malicious client cannot
     * collide with or overwrite an existing file.
     */
    @Transactional
    public ProductDto uploadImage(UUID id, MultipartFile file) {
        log.info("▶ UPLOAD product image: id={}, originalName={}, size={}, contentType={}",
                id, file.getOriginalFilename(), file.getSize(), file.getContentType());

        if (file.isEmpty()) {
            throw new IllegalArgumentException("Empty file");
        }
        if (file.getSize() > MAX_IMAGE_BYTES) {
            throw new IllegalArgumentException("Image too large (max 5 MB)");
        }
        String contentType = file.getContentType();
        if (contentType == null || !ALLOWED_IMAGE_TYPES.contains(contentType.toLowerCase())) {
            throw new IllegalArgumentException("Unsupported image type: " + contentType);
        }

        var p = productRepo.findById(id)
                .orElseThrow(() -> new IllegalStateException("Product not found"));

        String ext = extensionFor(contentType);
        String filename = UUID.randomUUID() + ext;

        try {
            Path dir = Paths.get(uploadsDir).toAbsolutePath().normalize();
            Files.createDirectories(dir);
            Path target = dir.resolve(filename).normalize();
            // Defence-in-depth: ensure the resolved path is still inside dir.
            if (!target.startsWith(dir)) {
                throw new IllegalStateException("Resolved upload path escapes uploads dir");
            }
            try (var in = file.getInputStream()) {
                Files.copy(in, target, StandardCopyOption.REPLACE_EXISTING);
            }
        } catch (IOException ex) {
            log.error("  ✗ failed to write upload", ex);
            throw new IllegalStateException("Failed to store uploaded image", ex);
        }

        String publicUrl = stripTrailingSlash(publicBaseUrl) + "/" + filename;
        p.setImageUrl(publicUrl);
        log.info("✓ product image uploaded: id={}, url={}", id, publicUrl);
        return toDto(p);
    }

    private static String extensionFor(String contentType) {
        return switch (contentType.toLowerCase()) {
            case "image/jpeg" -> ".jpg";
            case "image/png"  -> ".png";
            case "image/webp" -> ".webp";
            case "image/gif"  -> ".gif";
            default           -> "";
        };
    }

    private static String stripTrailingSlash(String s) {
        return s.endsWith("/") ? s.substring(0, s.length() - 1) : s;
    }

    @Transactional(readOnly = true)
    public ProductDto findByBarcode(String barcode) {
        return productRepo.findByBarcode(barcode)
                .map(this::toDto)
                .orElseThrow(() -> new IllegalStateException("Product not found"));
    }

    @Transactional(readOnly = true)
    public List<ProductDto> findAllByIds(List<UUID> ids) {
        if (ids == null || ids.isEmpty()) return List.of();

        Map<UUID, ProductDto> mapped = new HashMap<>();
        productRepo.findAllById(ids)
                .forEach(product -> mapped.put(product.getId(), toDto(product)));

        return ids.stream()
                .map(mapped::get)
                .filter(dto -> dto != null)
                .toList();
    }
}