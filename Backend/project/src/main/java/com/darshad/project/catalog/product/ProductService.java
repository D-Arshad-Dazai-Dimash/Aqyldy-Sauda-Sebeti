package com.darshad.project.catalog.product;

import com.darshad.project.catalog.category.Category;
import com.darshad.project.catalog.category.CategoryRepository;
import com.darshad.project.catalog.pricehistory.PriceHistory;
import com.darshad.project.catalog.pricehistory.PriceHistoryRepository;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.HashSet;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class ProductService {

    private static final Logger log = LoggerFactory.getLogger(ProductService.class);

    private final ProductRepository productRepo;
    private final CategoryRepository categoryRepo;
    private final PriceHistoryRepository priceHistoryRepo;

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

    @Transactional(readOnly = true)
    public ProductDto findByBarcode(String barcode) {
        return productRepo.findByBarcode(barcode)
                .map(this::toDto)
                .orElseThrow(() -> new IllegalStateException("Product not found"));
    }
}