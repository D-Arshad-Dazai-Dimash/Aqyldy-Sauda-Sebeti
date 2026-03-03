package com.darshad.project.catalog.category;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
public class CategoryService {

    private final CategoryRepository repo;

    public List<CategoryDto> list() {
        return repo.findAll().stream()
                .map(c -> new CategoryDto(c.getId(), c.getName(), c.getSlug()))
                .toList();
    }

    @Transactional
    public CategoryDto create(CategoryCreateRequest req) {
        if (repo.existsBySlug(req.slug())) {
            throw new IllegalStateException("Category slug already exists");
        }
        var c = Category.builder()
                .name(req.name())
                .slug(req.slug())
                .build();
        c = repo.save(c);
        return new CategoryDto(c.getId(), c.getName(), c.getSlug());
    }
}