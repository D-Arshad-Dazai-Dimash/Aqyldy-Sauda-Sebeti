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
-- 4. Move subcategories of Frozen/Fruits/Meat/Vegetables
--    under the new "Азық-түлік" category
-- ============================================================
UPDATE subcategories
SET category_id = (SELECT id FROM categories WHERE slug = 'azyk-tulik')
WHERE category_id IN (
    SELECT id FROM categories WHERE slug IN ('frozen', 'fruits', 'meat', 'vegetables')
);

-- ============================================================
-- 5. Move product_categories rows for those products
--    so they belong to "Азық-түлік" instead of old categories
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

-- ============================================================
-- 7. Rename / merge subcategories → Kazakh names
-- ============================================================

-- Bakery
UPDATE subcategories SET name = 'Ақ нан',               slug = 'ak-nan'       WHERE slug = 'bread';

-- Dairy
UPDATE subcategories SET name = 'Ірімшік',              slug = 'irimshik'     WHERE slug = 'cheese';
UPDATE subcategories SET name = 'Сүт және қаймақ',      slug = 'sut-qaimaq'   WHERE slug = 'milk-fermented';

-- Drinks
UPDATE subcategories SET name = 'Газдалған сулар',      slug = 'gaz-sular'    WHERE slug = 'soda';
UPDATE subcategories SET name = 'Ауыз су',              slug = 'auyz-su'      WHERE slug = 'water';

-- Snacks
UPDATE subcategories SET name = 'Кәмпиттер',            slug = 'kampitter'    WHERE slug = 'chips';

-- Household
UPDATE subcategories SET name = 'Ыдыс жуу',             slug = 'ydys-juu'     WHERE slug = 'dishwashing';

-- Personal Care
UPDATE subcategories SET name = 'Шампунь және сабын',   slug = 'shampun-sab'  WHERE slug = 'hair-care';

-- Азық-түлік: "Ет және шұжық" (dumplings + beef + poultry)
UPDATE subcategories SET name = 'Ет және шұжық',        slug = 'et-shujyk'    WHERE slug = 'dumplings';

-- Move beef & poultry products → et-shujyk, then delete those rows
UPDATE products
SET subcategory_id = (SELECT id FROM subcategories WHERE slug = 'et-shujyk')
WHERE subcategory_id IN (SELECT id FROM subcategories WHERE slug IN ('beef', 'poultry'));

DELETE FROM subcategories WHERE slug IN ('beef', 'poultry');

-- Азық-түлік: "Көкөністер мен жемістер" (pome-fruits + tropical-fruits + fresh-vegetables)
UPDATE subcategories SET name = 'Көкөністер мен жемістер', slug = 'kok-zhemis' WHERE slug = 'pome-fruits';

-- Move tropical-fruits & fresh-vegetables products → kok-zhemis, then delete
UPDATE products
SET subcategory_id = (SELECT id FROM subcategories WHERE slug = 'kok-zhemis')
WHERE subcategory_id IN (SELECT id FROM subcategories WHERE slug IN ('tropical-fruits', 'fresh-vegetables'));

DELETE FROM subcategories WHERE slug IN ('tropical-fruits', 'fresh-vegetables');
