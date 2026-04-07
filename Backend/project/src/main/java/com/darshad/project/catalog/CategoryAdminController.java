package com.darshad.project.catalog;

import com.darshad.project.catalog.category.CategoryCreateRequest;
import com.darshad.project.catalog.category.CategoryDto;
import com.darshad.project.catalog.category.CategoryService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

/**
 * B14: Admin endpoints for managing categories. Public read still lives
 * on {@code GET /api/categories} (CatalogPublicController); the write
 * surface is moved here so it sits under the {@code /api/admin/**}
 * security rule.
 */
@PreAuthorize("hasRole('ADMIN')")
@RestController
@RequestMapping("/api/admin/categories")
@RequiredArgsConstructor
public class CategoryAdminController {

    private final CategoryService categoryService;

    @PostMapping
    public CategoryDto create(@Valid @RequestBody CategoryCreateRequest req) {
        return categoryService.create(req);
    }

    @PutMapping("/{id}")
    public CategoryDto update(@PathVariable UUID id, @Valid @RequestBody CategoryCreateRequest req) {
        return categoryService.update(id, req);
    }

    @DeleteMapping("/{id}")
    public void delete(@PathVariable UUID id) {
        categoryService.delete(id);
    }
}
