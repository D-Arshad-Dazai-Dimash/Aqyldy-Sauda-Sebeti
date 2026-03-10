package com.darshad.project.catalog.product;

import org.springframework.data.jpa.domain.Specification;

import java.util.UUID;

public class ProductSpecs {

    public static Specification<Product> isActive(Boolean active) {

        return (root, query, cb) -> {
            if (active == null) {
                return cb.conjunction();
            }
            return cb.equal(root.get("active"), active);
        };
    }

    public static Specification<Product> search(String text) {

        return (root, query, cb) -> {
            if (text == null || text.isBlank()) {
                return cb.conjunction();
            }

            String like = "%" + text.toLowerCase() + "%";

            return cb.like(cb.lower(root.get("title")), like);
        };
    }

    public static Specification<Product> inCategory(UUID categoryId) {

        return (root, query, cb) -> {
            if (categoryId == null) {
                return cb.conjunction();
            }

            query.distinct(true);

            var join = root.join("categories");

            return cb.equal(join.get("id"), categoryId);
        };
    }
}