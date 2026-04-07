package com.darshad.project.catalog.category;

import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class CategoryService {

    private static final Logger log = LoggerFactory.getLogger(CategoryService.class);

    private final CategoryRepository repo;

    public List<CategoryDto> list() {
        var categories = repo.findAll().stream()
                .map(c -> new CategoryDto(c.getId(), c.getName(), c.getSlug()))
                .toList();
        log.debug("▶ list categories: found {}", categories.size());
        return categories;
    }

    @Transactional
    public CategoryDto create(CategoryCreateRequest req) {
        log.info("▶ CREATE category: name={}, slug={}", req.name(), req.slug());
        if (repo.existsBySlug(req.slug())) {
            log.warn("  ✗ slug already exists: {}", req.slug());
            throw new IllegalStateException("Category slug already exists");
        }
        var c = Category.builder()
                .name(req.name())
                .slug(req.slug())
                .build();
        c = repo.save(c);
        log.info("✓ category CREATED: id={}, name={}", c.getId(), c.getName());
        return new CategoryDto(c.getId(), c.getName(), c.getSlug());
    }

    @Transactional
    public CategoryDto update(UUID id, CategoryCreateRequest req) {
        log.info("▶ UPDATE category: id={}, name={}, slug={}", id, req.name(), req.slug());
        var c = repo.findById(id)
                .orElseThrow(() -> new IllegalStateException("Category not found"));

        // Allow renaming the slug only if it does not collide with another row.
        if (!c.getSlug().equals(req.slug()) && repo.existsBySlug(req.slug())) {
            log.warn("  ✗ slug already in use by another category: {}", req.slug());
            throw new IllegalStateException("Category slug already exists");
        }

        c.setName(req.name());
        c.setSlug(req.slug());
        log.info("✓ category UPDATED: id={}", id);
        return new CategoryDto(c.getId(), c.getName(), c.getSlug());
    }

    @Transactional
    public void delete(UUID id) {
        log.info("▶ DELETE category: id={}", id);
        if (!repo.existsById(id)) {
            throw new IllegalStateException("Category not found");
        }
        // The product_categories join table has FK -> categories(id); we
        // rely on the schema's ON DELETE CASCADE there to clean up the
        // association rows. Products themselves are not touched.
        repo.deleteById(id);
        log.info("✓ category DELETED: id={}", id);
    }
}