package com.darshad.project.catalog.product;

import com.darshad.project.catalog.category.CategoryRepository;
import lombok.RequiredArgsConstructor;
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

    private final ProductRepository productRepo;
    private final CategoryRepository categoryRepo;

    public Page<ProductDto> search(String q, UUID categoryId, Boolean active, Pageable pageable) {
        Specification<Product> spec = Specification
                .where(ProductSpecs.search(q))
                .and(ProductSpecs.inCategory(categoryId))
                .and(ProductSpecs.isActive(active));

        return productRepo.findAll(spec, pageable)
                .map(this::toDto);
    }

    public ProductDto get(UUID id) {
        return productRepo.findById(id)
                .map(this::toDto)
                .orElseThrow(() -> new IllegalStateException("Product not found"));
    }

    @Transactional
    public ProductDto create(ProductUpsertRequest req) {
        var p = Product.builder()
                .title(req.title())
                .description(req.description())
                .price(req.price())
                .imageUrl(req.imageUrl())
                .active(req.active() == null || req.active())
                .build();

        applyCategories(p, req);
        return toDto(productRepo.save(p));
    }

    @Transactional
    public ProductDto update(UUID id, ProductUpsertRequest req) {
        var p = productRepo.findById(id)
                .orElseThrow(() -> new IllegalStateException("Product not found"));

        p.setTitle(req.title());
        p.setDescription(req.description());
        p.setPrice(req.price());
        p.setImageUrl(req.imageUrl());
        if (req.active() != null) p.setActive(req.active());

        applyCategories(p, req);
        return toDto(p);
    }

    @Transactional
    public void delete(UUID id) {
        productRepo.deleteById(id);
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
                p.getImageUrl(),
                p.isActive(),
                p.getCategories().stream().map(c -> c.getId()).toList()
        );
    }
}