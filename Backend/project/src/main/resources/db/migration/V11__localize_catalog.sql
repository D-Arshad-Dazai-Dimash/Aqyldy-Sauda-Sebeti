-- V11: Localize categories and subcategories to Kazakh,
--      merge food sub-categories into one top-level category.

-- ============================================================
-- 1. Create "Азық-түлік" category (food / grocery) if absent
-- ============================================================
INSERT INTO categories (id, name, slug, created_at)
VALUES (gen_random_uuid(), 'Азық-түлік', 'azyk-tulik', NOW())
ON CONFLICT (slug) DO NOTHING;

-- ============================================================
-- 2. Create "Үй жануарларына" category if absent
-- ============================================================
INSERT INTO categories (id, name, slug, created_at)
VALUES (gen_random_uuid(), 'Үй жануарларына', 'ui-zhanuar', NOW())
ON CONFLICT (slug) DO NOTHING;

-- ============================================================
-- 3. Rename remaining English categories → Kazakh
-- ============================================================
UPDATE categories SET name = 'Нан өнімдері',     slug = 'nan-onimderi'    WHERE slug = 'bakery';
UPDATE categories SET name = 'Сүт өнімдері',     slug = 'sut-onimderi'    WHERE slug = 'dairy';
UPDATE categories SET name = 'Сусындар',          slug = 'susyndtar'       WHERE slug = 'drinks';
UPDATE categories SET name = 'Тұрмыстық химия',  slug = 'turmystyk-himia' WHERE slug = 'household';
UPDATE categories SET name = 'Гигиена',           slug = 'gigena'          WHERE slug = 'personal-care';
UPDATE categories SET name = 'Тәттілер',          slug = 'tattiler'        WHERE slug = 'snacks';

-- ============================================================
-- 4. Move product_categories rows so they belong to "Азық-түлік"
-- ============================================================
UPDATE product_categories
SET category_id = (SELECT id FROM categories WHERE slug = 'azyk-tulik')
WHERE category_id IN (
    SELECT id FROM categories WHERE slug IN ('frozen', 'fruits', 'meat', 'vegetables')
);

-- ============================================================
-- 6. Delete the now-empty English food categories
-- ============================================================
DELETE FROM categories WHERE slug IN ('frozen', 'fruits', 'meat', 'vegetables');

