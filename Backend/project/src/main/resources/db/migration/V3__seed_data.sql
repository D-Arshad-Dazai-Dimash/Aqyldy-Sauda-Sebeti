-- ============================================================
-- V3: Comprehensive seed data for development/demo
-- ============================================================

-- ======================== STORES ========================
-- Insert stores only if they don't already exist
INSERT INTO stores (id, name, address, description, phone, logo_url, working_hours, active, created_at)
SELECT gen_random_uuid(), 'Magnum', 'ул. Абая 150, Алматы', 'Крупнейшая сеть супермаркетов Казахстана', '+7 727 357 10 10', NULL, '08:00-23:00', true, now()
WHERE NOT EXISTS (SELECT 1 FROM stores WHERE name = 'Magnum');

INSERT INTO stores (id, name, address, description, phone, logo_url, working_hours, active, created_at)
SELECT gen_random_uuid(), 'Small', 'ул. Тимирязева 42, Алматы', 'Сеть магазинов у дома', '+7 727 250 50 50', NULL, '07:00-00:00', true, now()
WHERE NOT EXISTS (SELECT 1 FROM stores WHERE name = 'Small');

INSERT INTO stores (id, name, address, description, phone, logo_url, working_hours, active, created_at)
SELECT gen_random_uuid(), 'FixPrice', 'ул. Жандосова 58, Алматы', 'Магазин фиксированных цен', '+7 727 300 30 30', NULL, '09:00-22:00', true, now()
WHERE NOT EXISTS (SELECT 1 FROM stores WHERE name = 'FixPrice');

-- ======================== CATEGORIES ========================
INSERT INTO categories (id, name, slug, created_at)
SELECT gen_random_uuid(), 'Dairy', 'dairy', now()
WHERE NOT EXISTS (SELECT 1 FROM categories WHERE slug = 'dairy');

INSERT INTO categories (id, name, slug, created_at)
SELECT gen_random_uuid(), 'Meat', 'meat', now()
WHERE NOT EXISTS (SELECT 1 FROM categories WHERE slug = 'meat');

INSERT INTO categories (id, name, slug, created_at)
SELECT gen_random_uuid(), 'Fruits', 'fruits', now()
WHERE NOT EXISTS (SELECT 1 FROM categories WHERE slug = 'fruits');

INSERT INTO categories (id, name, slug, created_at)
SELECT gen_random_uuid(), 'Vegetables', 'vegetables', now()
WHERE NOT EXISTS (SELECT 1 FROM categories WHERE slug = 'vegetables');

INSERT INTO categories (id, name, slug, created_at)
SELECT gen_random_uuid(), 'Drinks', 'drinks', now()
WHERE NOT EXISTS (SELECT 1 FROM categories WHERE slug = 'drinks');

INSERT INTO categories (id, name, slug, created_at)
SELECT gen_random_uuid(), 'Bakery', 'bakery', now()
WHERE NOT EXISTS (SELECT 1 FROM categories WHERE slug = 'bakery');

INSERT INTO categories (id, name, slug, created_at)
SELECT gen_random_uuid(), 'Snacks', 'snacks', now()
WHERE NOT EXISTS (SELECT 1 FROM categories WHERE slug = 'snacks');

INSERT INTO categories (id, name, slug, created_at)
SELECT gen_random_uuid(), 'Frozen', 'frozen', now()
WHERE NOT EXISTS (SELECT 1 FROM categories WHERE slug = 'frozen');

INSERT INTO categories (id, name, slug, created_at)
SELECT gen_random_uuid(), 'Household', 'household', now()
WHERE NOT EXISTS (SELECT 1 FROM categories WHERE slug = 'household');

INSERT INTO categories (id, name, slug, created_at)
SELECT gen_random_uuid(), 'Personal Care', 'personal-care', now()
WHERE NOT EXISTS (SELECT 1 FROM categories WHERE slug = 'personal-care');

-- ======================== PRODUCTS ========================
-- Dairy
INSERT INTO products (id, title, description, price, barcode, stock, discount, unit, weight, active, created_at)
SELECT gen_random_uuid(), 'Молоко Lactel 1л', 'Молоко пастеризованное 2.5%', 650, '4870000100011', 200, NULL, 'piece', '1L', true, now()
WHERE NOT EXISTS (SELECT 1 FROM products WHERE barcode = '4870000100011');

INSERT INTO products (id, title, description, price, barcode, stock, discount, unit, weight, active, created_at)
SELECT gen_random_uuid(), 'Кефир Фуд Мастер 1л', 'Кефир 1% жирности', 580, '4870000100022', 150, NULL, 'piece', '1L', true, now()
WHERE NOT EXISTS (SELECT 1 FROM products WHERE barcode = '4870000100022');

INSERT INTO products (id, title, description, price, barcode, stock, discount, unit, weight, active, created_at)
SELECT gen_random_uuid(), 'Сметана Президент 200г', 'Сметана 20% жирности', 490, '4870000100033', 100, 10, 'piece', '200g', true, now()
WHERE NOT EXISTS (SELECT 1 FROM products WHERE barcode = '4870000100033');

INSERT INTO products (id, title, description, price, barcode, stock, discount, unit, weight, active, created_at)
SELECT gen_random_uuid(), 'Сыр Голландский 300г', 'Сыр полутвёрдый 45%', 1850, '4870000100044', 80, NULL, 'piece', '300g', true, now()
WHERE NOT EXISTS (SELECT 1 FROM products WHERE barcode = '4870000100044');

INSERT INTO products (id, title, description, price, barcode, stock, discount, unit, weight, active, created_at)
SELECT gen_random_uuid(), 'Йогурт Данон клубника', 'Йогурт питьевой клубничный', 350, '4870000100055', 200, 15, 'piece', '290g', true, now()
WHERE NOT EXISTS (SELECT 1 FROM products WHERE barcode = '4870000100055');

-- Meat
INSERT INTO products (id, title, description, price, barcode, stock, discount, unit, weight, active, created_at)
SELECT gen_random_uuid(), 'Курица филе 1кг', 'Охлаждённое куриное филе', 2200, '4870000200011', 100, NULL, 'kg', '1kg', true, now()
WHERE NOT EXISTS (SELECT 1 FROM products WHERE barcode = '4870000200011');

INSERT INTO products (id, title, description, price, barcode, stock, discount, unit, weight, active, created_at)
SELECT gen_random_uuid(), 'Говядина лопатка 1кг', 'Охлаждённая говядина', 3500, '4870000200022', 60, NULL, 'kg', '1kg', true, now()
WHERE NOT EXISTS (SELECT 1 FROM products WHERE barcode = '4870000200022');

INSERT INTO products (id, title, description, price, barcode, stock, discount, unit, weight, active, created_at)
SELECT gen_random_uuid(), 'Сосиски Молочные 500г', 'Сосиски варёные', 890, '4870000200033', 120, 20, 'piece', '500g', true, now()
WHERE NOT EXISTS (SELECT 1 FROM products WHERE barcode = '4870000200033');

-- Fruits
INSERT INTO products (id, title, description, price, barcode, stock, discount, unit, weight, active, created_at)
SELECT gen_random_uuid(), 'Яблоки Голден 1кг', 'Яблоки свежие', 850, '4870000300011', 300, NULL, 'kg', '1kg', true, now()
WHERE NOT EXISTS (SELECT 1 FROM products WHERE barcode = '4870000300011');

INSERT INTO products (id, title, description, price, barcode, stock, discount, unit, weight, active, created_at)
SELECT gen_random_uuid(), 'Бананы 1кг', 'Бананы свежие эквадорские', 990, '4870000300022', 250, 10, 'kg', '1kg', true, now()
WHERE NOT EXISTS (SELECT 1 FROM products WHERE barcode = '4870000300022');

INSERT INTO products (id, title, description, price, barcode, stock, discount, unit, weight, active, created_at)
SELECT gen_random_uuid(), 'Апельсины 1кг', 'Апельсины свежие', 1200, '4870000300033', 200, NULL, 'kg', '1kg', true, now()
WHERE NOT EXISTS (SELECT 1 FROM products WHERE barcode = '4870000300033');

INSERT INTO products (id, title, description, price, barcode, stock, discount, unit, weight, active, created_at)
SELECT gen_random_uuid(), 'Виноград красный 1кг', 'Виноград столовый', 2500, '4870000300044', 80, NULL, 'kg', '1kg', true, now()
WHERE NOT EXISTS (SELECT 1 FROM products WHERE barcode = '4870000300044');

-- Vegetables
INSERT INTO products (id, title, description, price, barcode, stock, discount, unit, weight, active, created_at)
SELECT gen_random_uuid(), 'Помидоры 1кг', 'Помидоры свежие', 900, '4870000400011', 200, NULL, 'kg', '1kg', true, now()
WHERE NOT EXISTS (SELECT 1 FROM products WHERE barcode = '4870000400011');

INSERT INTO products (id, title, description, price, barcode, stock, discount, unit, weight, active, created_at)
SELECT gen_random_uuid(), 'Огурцы 1кг', 'Огурцы свежие', 750, '4870000400022', 180, NULL, 'kg', '1kg', true, now()
WHERE NOT EXISTS (SELECT 1 FROM products WHERE barcode = '4870000400022');

INSERT INTO products (id, title, description, price, barcode, stock, discount, unit, weight, active, created_at)
SELECT gen_random_uuid(), 'Картофель 1кг', 'Картофель свежий', 350, '4870000400033', 500, NULL, 'kg', '1kg', true, now()
WHERE NOT EXISTS (SELECT 1 FROM products WHERE barcode = '4870000400033');

INSERT INTO products (id, title, description, price, barcode, stock, discount, unit, weight, active, created_at)
SELECT gen_random_uuid(), 'Морковь 1кг', 'Морковь свежая', 300, '4870000400044', 400, NULL, 'kg', '1kg', true, now()
WHERE NOT EXISTS (SELECT 1 FROM products WHERE barcode = '4870000400044');

INSERT INTO products (id, title, description, price, barcode, stock, discount, unit, weight, active, created_at)
SELECT gen_random_uuid(), 'Лук репчатый 1кг', 'Лук жёлтый', 280, '4870000400055', 400, NULL, 'kg', '1kg', true, now()
WHERE NOT EXISTS (SELECT 1 FROM products WHERE barcode = '4870000400055');

-- Drinks
INSERT INTO products (id, title, description, price, barcode, stock, discount, unit, weight, active, created_at)
SELECT gen_random_uuid(), 'Coca-Cola 1.5л', 'Газированный напиток', 650, '4870000500011', 300, NULL, 'piece', '1.5L', true, now()
WHERE NOT EXISTS (SELECT 1 FROM products WHERE barcode = '4870000500011');

INSERT INTO products (id, title, description, price, barcode, stock, discount, unit, weight, active, created_at)
SELECT gen_random_uuid(), 'Вода Tassay 1.5л', 'Вода питьевая негазированная', 250, '4870000500022', 500, NULL, 'piece', '1.5L', true, now()
WHERE NOT EXISTS (SELECT 1 FROM products WHERE barcode = '4870000500022');

INSERT INTO products (id, title, description, price, barcode, stock, discount, unit, weight, active, created_at)
SELECT gen_random_uuid(), 'Сок Rich Апельсин 1л', 'Сок апельсиновый 100%', 890, '4870000500033', 150, 5, 'piece', '1L', true, now()
WHERE NOT EXISTS (SELECT 1 FROM products WHERE barcode = '4870000500033');

INSERT INTO products (id, title, description, price, barcode, stock, discount, unit, weight, active, created_at)
SELECT gen_random_uuid(), 'Чай Lipton 25п', 'Чай чёрный в пакетиках', 590, '4870000500044', 200, NULL, 'piece', '50g', true, now()
WHERE NOT EXISTS (SELECT 1 FROM products WHERE barcode = '4870000500044');

INSERT INTO products (id, title, description, price, barcode, stock, discount, unit, weight, active, created_at)
SELECT gen_random_uuid(), 'Кофе Nescafe Gold 95г', 'Кофе растворимый сублимированный', 2400, '4870000500055', 100, NULL, 'piece', '95g', true, now()
WHERE NOT EXISTS (SELECT 1 FROM products WHERE barcode = '4870000500055');

-- Bakery
INSERT INTO products (id, title, description, price, barcode, stock, discount, unit, weight, active, created_at)
SELECT gen_random_uuid(), 'Хлеб белый нарезной', 'Хлеб пшеничный высшего сорта', 250, '4870000600011', 300, NULL, 'piece', '500g', true, now()
WHERE NOT EXISTS (SELECT 1 FROM products WHERE barcode = '4870000600011');

INSERT INTO products (id, title, description, price, barcode, stock, discount, unit, weight, active, created_at)
SELECT gen_random_uuid(), 'Батон Нарезной', 'Батон пшеничный', 200, '4870000600022', 250, NULL, 'piece', '400g', true, now()
WHERE NOT EXISTS (SELECT 1 FROM products WHERE barcode = '4870000600022');

INSERT INTO products (id, title, description, price, barcode, stock, discount, unit, weight, active, created_at)
SELECT gen_random_uuid(), 'Лаваш тонкий', 'Лаваш армянский тонкий', 350, '4870000600033', 150, NULL, 'piece', '250g', true, now()
WHERE NOT EXISTS (SELECT 1 FROM products WHERE barcode = '4870000600033');

-- Snacks
INSERT INTO products (id, title, description, price, barcode, stock, discount, unit, weight, active, created_at)
SELECT gen_random_uuid(), 'Чипсы Lays Сметана 150г', 'Картофельные чипсы', 690, '4870000700011', 200, NULL, 'piece', '150g', true, now()
WHERE NOT EXISTS (SELECT 1 FROM products WHERE barcode = '4870000700011');

INSERT INTO products (id, title, description, price, barcode, stock, discount, unit, weight, active, created_at)
SELECT gen_random_uuid(), 'Шоколад Alpen Gold 85г', 'Молочный шоколад', 450, '4870000700022', 300, 10, 'piece', '85g', true, now()
WHERE NOT EXISTS (SELECT 1 FROM products WHERE barcode = '4870000700022');

-- Frozen
INSERT INTO products (id, title, description, price, barcode, stock, discount, unit, weight, active, created_at)
SELECT gen_random_uuid(), 'Пельмени Домашние 900г', 'Пельмени из говядины и свинины', 1500, '4870000800011', 100, NULL, 'piece', '900g', true, now()
WHERE NOT EXISTS (SELECT 1 FROM products WHERE barcode = '4870000800011');

INSERT INTO products (id, title, description, price, barcode, stock, discount, unit, weight, active, created_at)
SELECT gen_random_uuid(), 'Мороженое Пломбир 500мл', 'Пломбир ванильный', 890, '4870000800022', 150, 15, 'piece', '500ml', true, now()
WHERE NOT EXISTS (SELECT 1 FROM products WHERE barcode = '4870000800022');

-- Household
INSERT INTO products (id, title, description, price, barcode, stock, discount, unit, weight, active, created_at)
SELECT gen_random_uuid(), 'Средство для посуды Fairy 450мл', 'Средство для мытья посуды', 750, '4870000900011', 200, NULL, 'piece', '450ml', true, now()
WHERE NOT EXISTS (SELECT 1 FROM products WHERE barcode = '4870000900011');

INSERT INTO products (id, title, description, price, barcode, stock, discount, unit, weight, active, created_at)
SELECT gen_random_uuid(), 'Порошок Tide 3кг', 'Стиральный порошок автомат', 3200, '4870000900022', 80, 20, 'piece', '3kg', true, now()
WHERE NOT EXISTS (SELECT 1 FROM products WHERE barcode = '4870000900022');

-- Personal Care
INSERT INTO products (id, title, description, price, barcode, stock, discount, unit, weight, active, created_at)
SELECT gen_random_uuid(), 'Шампунь Head & Shoulders 400мл', 'Шампунь против перхоти', 2100, '4870001000011', 100, NULL, 'piece', '400ml', true, now()
WHERE NOT EXISTS (SELECT 1 FROM products WHERE barcode = '4870001000011');

INSERT INTO products (id, title, description, price, barcode, stock, discount, unit, weight, active, created_at)
SELECT gen_random_uuid(), 'Зубная паста Colgate 100мл', 'Зубная паста с фтором', 690, '4870001000022', 200, NULL, 'piece', '100ml', true, now()
WHERE NOT EXISTS (SELECT 1 FROM products WHERE barcode = '4870001000022');

-- ======================== PRODUCT-CATEGORY LINKS ========================
-- Dairy products
INSERT INTO product_categories (product_id, category_id)
SELECT p.id, c.id FROM products p, categories c
WHERE p.barcode IN ('4870000100011','4870000100022','4870000100033','4870000100044','4870000100055')
  AND c.slug = 'dairy'
ON CONFLICT DO NOTHING;

-- Meat products
INSERT INTO product_categories (product_id, category_id)
SELECT p.id, c.id FROM products p, categories c
WHERE p.barcode IN ('4870000200011','4870000200022','4870000200033')
  AND c.slug = 'meat'
ON CONFLICT DO NOTHING;

-- Fruits
INSERT INTO product_categories (product_id, category_id)
SELECT p.id, c.id FROM products p, categories c
WHERE p.barcode IN ('4870000300011','4870000300022','4870000300033','4870000300044')
  AND c.slug = 'fruits'
ON CONFLICT DO NOTHING;

-- Vegetables
INSERT INTO product_categories (product_id, category_id)
SELECT p.id, c.id FROM products p, categories c
WHERE p.barcode IN ('4870000400011','4870000400022','4870000400033','4870000400044','4870000400055')
  AND c.slug = 'vegetables'
ON CONFLICT DO NOTHING;

-- Drinks
INSERT INTO product_categories (product_id, category_id)
SELECT p.id, c.id FROM products p, categories c
WHERE p.barcode IN ('4870000500011','4870000500022','4870000500033','4870000500044','4870000500055')
  AND c.slug = 'drinks'
ON CONFLICT DO NOTHING;

-- Bakery
INSERT INTO product_categories (product_id, category_id)
SELECT p.id, c.id FROM products p, categories c
WHERE p.barcode IN ('4870000600011','4870000600022','4870000600033')
  AND c.slug = 'bakery'
ON CONFLICT DO NOTHING;

-- Snacks
INSERT INTO product_categories (product_id, category_id)
SELECT p.id, c.id FROM products p, categories c
WHERE p.barcode IN ('4870000700011','4870000700022')
  AND c.slug = 'snacks'
ON CONFLICT DO NOTHING;

-- Frozen
INSERT INTO product_categories (product_id, category_id)
SELECT p.id, c.id FROM products p, categories c
WHERE p.barcode IN ('4870000800011','4870000800022')
  AND c.slug = 'frozen'
ON CONFLICT DO NOTHING;

-- Household
INSERT INTO product_categories (product_id, category_id)
SELECT p.id, c.id FROM products p, categories c
WHERE p.barcode IN ('4870000900011','4870000900022')
  AND c.slug = 'household'
ON CONFLICT DO NOTHING;

-- Personal Care
INSERT INTO product_categories (product_id, category_id)
SELECT p.id, c.id FROM products p, categories c
WHERE p.barcode IN ('4870001000011','4870001000022')
  AND c.slug = 'personal-care'
ON CONFLICT DO NOTHING;

-- ======================== INVENTORY ========================
-- Add all new products to all stores with random-ish quantities
INSERT INTO inventory (store_id, product_id, quantity)
SELECT s.id, p.id, 30 + (RANDOM() * 70)::int
FROM stores s
CROSS JOIN products p
WHERE NOT EXISTS (
    SELECT 1 FROM inventory i WHERE i.store_id = s.id AND i.product_id = p.id
);
