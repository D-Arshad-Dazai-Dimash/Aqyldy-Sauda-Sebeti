package com.darshad.project.catalog.category;

import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

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
}