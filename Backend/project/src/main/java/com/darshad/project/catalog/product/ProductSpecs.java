package com.darshad.project.catalog.product;

import org.springframework.data.jpa.domain.Specification;

import java.util.UUID;
public class ProductSpecs {

    public static Specification<Product> search(String text) {

        if (text == null || text.isBlank()) {
            return null;
        }

        return (root, query, cb) ->
                cb.like(cb.lower(root.get("title")),
                        "%" + text.toLowerCase() + "%");
    }

    public static Specification<Product> inCategory(UUID categoryId) {

        if (categoryId == null) {
            return null;
        }

        return (root, query, cb) -> {
            query.distinct(true);
            var join = root.join("categories");
            return cb.equal(join.get("id"), categoryId);
        };
    }

    public static Specification<Product> inCategorySlug(String slug) {

        if (slug == null || slug.isBlank()) {
            return null;
        }

        return (root, query, cb) -> {
            query.distinct(true);
            var join = root.join("categories");
            return cb.equal(join.get("slug"), slug);
        };
    }

    public static Specification<Product> inSubcategoryName(String name) {

        if (name == null || name.isBlank()) {
            return null;
        }

        return (root, query, cb) -> {
            var join = root.join("subcategory", jakarta.persistence.criteria.JoinType.LEFT);
            return cb.equal(join.get("name"), name);
        };
    }

    public static Specification<Product> isActive(Boolean active) {

        if (active == null) {
            return null;
        }

        return (root, query, cb) ->
                cb.equal(root.get("active"), active);
    }
}