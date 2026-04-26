-- V12: Add subcategories table and link products to subcategory

CREATE TABLE subcategories (
    id         UUID PRIMARY KEY,
    category_id UUID NOT NULL REFERENCES categories(id) ON DELETE CASCADE,
    name       VARCHAR(120) NOT NULL,
    slug       VARCHAR(140) NOT NULL UNIQUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ
);

ALTER TABLE products
    ADD COLUMN subcategory_id UUID REFERENCES subcategories(id) ON DELETE SET NULL;
