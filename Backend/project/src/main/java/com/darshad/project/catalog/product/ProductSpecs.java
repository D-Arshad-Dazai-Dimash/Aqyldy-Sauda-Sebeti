package com.darshad.project.catalog.product;

import com.darshad.project.catalog.category.Category;
import org.springframework.data.jpa.domain.Specification;

import java.util.UUID;

public class ProductSpecs {

    public static Specification<Product> isActive(Boolean active) {
        if (active == null) return null;
        return (root, q, cb) -> cb.equal(root.get("active"), active);
    }

    public static Specification<Product> search(String text) {
        if (text == null || text.isBlank()) return null;
        String like = "%" + text.trim().toLowerCase() + "%";
        return (root, q, cb) -> cb.like(cb.lower(root.get("title")), like);
    }

    public static Specification<Product> inCategory(UUID categoryId) {
        if (categoryId == null) return null;
        return (root, q, cb) -> {
            q.distinct(true);
            var join = root.join("categories");
            return cb.equal(join.get("id"), categoryId);
        };
    }
}