package com.darshad.project.catalog.product;

import com.darshad.project.catalog.category.Category;
import com.darshad.project.catalog.category.CategoryRepository;
import com.darshad.project.catalog.pricehistory.PriceHistory;
import com.darshad.project.catalog.pricehistory.PriceHistoryRepository;
import com.darshad.project.infra.storage.ImageStorage;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.cache.annotation.CacheEvict;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
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
    private final ImageStorage imageStorage;

    public ProductService(
            ProductRepository productRepo,
            CategoryRepository categoryRepo,
            PriceHistoryRepository priceHistoryRepo,
            ImageStorage imageStorage
    ) {
        this.productRepo = productRepo;
        this.categoryRepo = categoryRepo;
        this.priceHistoryRepo = priceHistoryRepo;
        this.imageStorage = imageStorage;
    }

    @Transactional(readOnly = true)
    public Page<ProductDto> search(String q, UUID categoryId, String categorySlug,
                                    String subcategoryName, Boolean active, Pageable pageable) {

        log.debug("▶ product search: q={}, categoryId={}, categorySlug={}, subcategoryName={}, active={}",
                q, categoryId, categorySlug, subcategoryName, active);

        Specification<Product> spec = (root, query, cb) -> cb.conjunction();

        if (q != null && !q.isBlank()) {
            spec = spec.and(ProductSpecs.search(q));
        }

        if (categoryId != null) {
            spec = spec.and(ProductSpecs.inCategory(categoryId));
        }

        if (categorySlug != null && !categorySlug.isBlank()) {
            spec = spec.and(ProductSpecs.inCategorySlug(categorySlug));
        }

        if (subcategoryName != null && !subcategoryName.isBlank()) {
            spec = spec.and(ProductSpecs.inSubcategoryName(subcategoryName));
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

        // Idempotent by barcode: if a product with this barcode already exists,
        // reuse it instead of failing on the UNIQUE(barcode) constraint. This
        // makes scanning a known barcode in the merchant flow safe — we just
        // hand back the existing product so the caller can add it to its
        // own inventory.
        if (req.barcode() != null && !req.barcode().isBlank()) {
            var existing = productRepo.findByBarcode(req.barcode().trim()).orElse(null);
            if (existing != null) {
                log.info("  product with barcode={} already exists (id={}) — reusing",
                        req.barcode(), existing.getId());
                // Optionally enrich missing image / title — but never overwrite
                // an existing image so we don't trash data from another seller.
                if ((existing.getImageUrl() == null || existing.getImageUrl().isBlank())
                        && req.imageUrl() != null && !req.imageUrl().isBlank()) {
                    existing.setImageUrl(req.imageUrl());
                }
                return toDto(existing);
            }
        }

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
        var sub = p.getSubcategory();
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
                p.getCategories().stream().map(Category::getId).toList(),
                sub != null ? sub.getId() : null,
                sub != null ? sub.getSlug() : null,
                sub != null ? sub.getName() : null
        );
    }

    /**
     * Stores the uploaded image directly in the database as a base64-encoded
     * data URL. This avoids the need for an external object store or a
     * persistent volume — perfect for ephemeral PaaS deployments such as
     * DigitalOcean App Platform where the local filesystem is wiped on every
     * restart.
     *
     * Validates content-type and size up front to keep the column small.
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

        try {
            byte[] bytes = file.getBytes();
            String ext = extensionFor(contentType);
            String key = "products/" + id + "/" + UUID.randomUUID() + ext;
            String url = imageStorage.store(key, bytes, contentType.toLowerCase());
            p.setImageUrl(url);
            log.info("✓ product image saved: id={}, sizeBytes={}, remote={}, url={}",
                    id, bytes.length, imageStorage.isRemote(), maskUrl(url));
        } catch (IOException ex) {
            log.error("  ✗ failed to read uploaded file", ex);
            throw new IllegalStateException("Failed to read uploaded image", ex);
        }
        return toDto(p);
    }

    private static String extensionFor(String contentType) {
        return switch (contentType.toLowerCase()) {
            case "image/png" -> ".png";
            case "image/webp" -> ".webp";
            case "image/gif" -> ".gif";
            default -> ".jpg";
        };
    }

    private static String maskUrl(String url) {
        if (url == null) return "<null>";
        if (url.startsWith("data:")) return "data:..." + url.length() + "chars";
        return url;
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