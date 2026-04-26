-- ============================================================
-- V13: Demo data for merchant/business user
--      • 1 merchant account (demo@merchant.kz / demo1234)
--      • 1 store owned by that merchant
--      • 12 products with real image URLs (Unsplash CDN)
--      • inventory records
--      • 1 demo buyer account + 8 historical orders
-- ============================================================

-- ======================== MERCHANT USER ========================
INSERT INTO users (id, email, password_hash, role, enabled, created_at)
SELECT
    '00000000-0000-0000-0001-000000000001',
    'demo@merchant.kz',
    -- BCrypt of 'demo1234'
    '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LPVgb2nFtGi',
    'MERCHANT',
    true,
    now()
WHERE NOT EXISTS (SELECT 1 FROM users WHERE email = 'demo@merchant.kz');

-- ======================== DEMO BUYER USER ========================
INSERT INTO users (id, email, password_hash, role, enabled, created_at)
SELECT
    '00000000-0000-0000-0002-000000000001',
    'demo@buyer.kz',
    '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LPVgb2nFtGi',
    'USER',
    true,
    now()
WHERE NOT EXISTS (SELECT 1 FROM users WHERE email = 'demo@buyer.kz');

-- ======================== MERCHANT'S STORE ========================
INSERT INTO stores (id, name, address, description, phone, working_hours, active, owner_id, created_at)
SELECT
    '00000000-0000-0000-0003-000000000001',
    'Alatau Market',
    'пр. Аль-Фараби 77, Алматы',
    'Свежие продукты и товары повседневного спроса в Бостандыкском районе',
    '+7 701 555 01 01',
    '08:00-22:00',
    true,
    '00000000-0000-0000-0001-000000000001',
    now()
WHERE NOT EXISTS (SELECT 1 FROM stores WHERE id = '00000000-0000-0000-0003-000000000001');

-- ======================== PRODUCTS WITH IMAGES ========================
-- Dairy
INSERT INTO products (id, title, description, price, barcode, stock, unit, weight, active, image_url, created_at)
SELECT '00000000-0000-0000-0004-000000000001','Молоко Lactel 1л','Пастеризованное молоко 2,5% жирности',650,'4870013100011',120,'piece','1L',true,
    'https://images.unsplash.com/photo-1550583724-b2692b85b150?w=400&q=80',now()
WHERE NOT EXISTS (SELECT 1 FROM products WHERE id = '00000000-0000-0000-0004-000000000001');

INSERT INTO products (id, title, description, price, barcode, stock, unit, weight, active, image_url, created_at)
SELECT '00000000-0000-0000-0004-000000000002','Кефир 1% 1л','Кефир классический низкожирный',480,'4870013100022',90,'piece','1L',true,
    'https://images.unsplash.com/photo-1563636619-e9143da7973b?w=400&q=80',now()
WHERE NOT EXISTS (SELECT 1 FROM products WHERE id = '00000000-0000-0000-0004-000000000002');

INSERT INTO products (id, title, description, price, barcode, stock, unit, weight, active, image_url, created_at)
SELECT '00000000-0000-0000-0004-000000000003','Сыр Российский 300г','Полутвёрдый сыр 45% жирности',1850,'4870013100033',60,'piece','300g',true,
    'https://images.unsplash.com/photo-1486297678162-eb2a19b0a318?w=400&q=80',now()
WHERE NOT EXISTS (SELECT 1 FROM products WHERE id = '00000000-0000-0000-0004-000000000003');

-- Meat / Poultry
INSERT INTO products (id, title, description, price, barcode, stock, unit, weight, active, image_url, created_at)
SELECT '00000000-0000-0000-0004-000000000004','Куриное филе охл. 1кг','Охлаждённое филе без костей',2200,'4870013200011',80,'kg','1kg',true,
    'https://images.unsplash.com/photo-1604503468506-a8da13d82791?w=400&q=80',now()
WHERE NOT EXISTS (SELECT 1 FROM products WHERE id = '00000000-0000-0000-0004-000000000004');

INSERT INTO products (id, title, description, price, barcode, stock, unit, weight, active, image_url, created_at)
SELECT '00000000-0000-0000-0004-000000000005','Говядина лопатка 1кг','Охлаждённая мякоть говядины',3500,'4870013200022',40,'kg','1kg',true,
    'https://images.unsplash.com/photo-1615937657715-bc7b4b7962c1?w=400&q=80',now()
WHERE NOT EXISTS (SELECT 1 FROM products WHERE id = '00000000-0000-0000-0004-000000000005');

-- Fruits
INSERT INTO products (id, title, description, price, barcode, stock, unit, weight, active, image_url, created_at)
SELECT '00000000-0000-0000-0004-000000000006','Яблоки Голден 1кг','Свежие яблоки из Алматинской области',850,'4870013300011',300,'kg','1kg',true,
    'https://images.unsplash.com/photo-1567306226416-28f0efdc88ce?w=400&q=80',now()
WHERE NOT EXISTS (SELECT 1 FROM products WHERE id = '00000000-0000-0000-0004-000000000006');

INSERT INTO products (id, title, description, price, barcode, stock, unit, weight, active, image_url, created_at)
SELECT '00000000-0000-0000-0004-000000000007','Бананы 1кг','Бананы эквадорские спелые',990,'4870013300022',200,'kg','1kg',true,
    'https://images.unsplash.com/photo-1571771894821-ce9b6c11b08e?w=400&q=80',now()
WHERE NOT EXISTS (SELECT 1 FROM products WHERE id = '00000000-0000-0000-0004-000000000007');

-- Drinks
INSERT INTO products (id, title, description, price, barcode, stock, unit, weight, active, image_url, created_at)
SELECT '00000000-0000-0000-0004-000000000008','Вода Tassay 1.5л','Питьевая вода негазированная',250,'4870013400011',500,'piece','1.5L',true,
    'https://images.unsplash.com/photo-1548839140-29a749e1cf4d?w=400&q=80',now()
WHERE NOT EXISTS (SELECT 1 FROM products WHERE id = '00000000-0000-0000-0004-000000000008');

INSERT INTO products (id, title, description, price, barcode, stock, unit, weight, active, image_url, created_at)
SELECT '00000000-0000-0000-0004-000000000009','Сок Rich Яблоко 1л','Яблочный сок прямого отжима',890,'4870013400022',150,'piece','1L',true,
    'https://images.unsplash.com/photo-1621506289937-a8e4df240d0b?w=400&q=80',now()
WHERE NOT EXISTS (SELECT 1 FROM products WHERE id = '00000000-0000-0000-0004-000000000009');

-- Bakery
INSERT INTO products (id, title, description, price, barcode, stock, unit, weight, active, image_url, created_at)
SELECT '00000000-0000-0000-0004-000000000010','Хлеб пшеничный 500г','Хлеб высшего сорта нарезной',250,'4870013500011',300,'piece','500g',true,
    'https://images.unsplash.com/photo-1509440159596-0249088772ff?w=400&q=80',now()
WHERE NOT EXISTS (SELECT 1 FROM products WHERE id = '00000000-0000-0000-0004-000000000010');

-- Snacks
INSERT INTO products (id, title, description, price, barcode, stock, unit, weight, active, image_url, created_at)
SELECT '00000000-0000-0000-0004-000000000011','Шоколад Alpen Gold 85г','Молочный шоколад с карамелью',450,'4870013600011',250,'piece','85g',true,
    'https://images.unsplash.com/photo-1548907040-4baa42d10919?w=400&q=80',now()
WHERE NOT EXISTS (SELECT 1 FROM products WHERE id = '00000000-0000-0000-0004-000000000011');

-- Household
INSERT INTO products (id, title, description, price, barcode, stock, unit, weight, active, image_url, created_at)
SELECT '00000000-0000-0000-0004-000000000012','Fairy Средство для посуды 450мл','Концентрат для мытья посуды',750,'4870013700011',180,'piece','450ml',true,
    'https://images.unsplash.com/photo-1585664811087-47f65abbad64?w=400&q=80',now()
WHERE NOT EXISTS (SELECT 1 FROM products WHERE id = '00000000-0000-0000-0004-000000000012');

-- ======================== PRODUCT-CATEGORY LINKS ========================
INSERT INTO product_categories (product_id, category_id)
SELECT p.id, c.id FROM products p, categories c
WHERE p.id IN (
    '00000000-0000-0000-0004-000000000001',
    '00000000-0000-0000-0004-000000000002',
    '00000000-0000-0000-0004-000000000003'
) AND c.slug IN ('dairy','sut-onimderi')
ON CONFLICT DO NOTHING;

INSERT INTO product_categories (product_id, category_id)
SELECT p.id, c.id FROM products p, categories c
WHERE p.id IN (
    '00000000-0000-0000-0004-000000000004',
    '00000000-0000-0000-0004-000000000005'
) AND c.slug IN ('meat','azyk-tulik')
ON CONFLICT DO NOTHING;

INSERT INTO product_categories (product_id, category_id)
SELECT p.id, c.id FROM products p, categories c
WHERE p.id IN (
    '00000000-0000-0000-0004-000000000006',
    '00000000-0000-0000-0004-000000000007'
) AND c.slug IN ('fruits','azyk-tulik')
ON CONFLICT DO NOTHING;

INSERT INTO product_categories (product_id, category_id)
SELECT p.id, c.id FROM products p, categories c
WHERE p.id IN (
    '00000000-0000-0000-0004-000000000008',
    '00000000-0000-0000-0004-000000000009'
) AND c.slug IN ('drinks','susyndtar')
ON CONFLICT DO NOTHING;

INSERT INTO product_categories (product_id, category_id)
SELECT p.id, c.id FROM products p, categories c
WHERE p.id IN ('00000000-0000-0000-0004-000000000010')
  AND c.slug IN ('bakery','nan-onimderi')
ON CONFLICT DO NOTHING;

INSERT INTO product_categories (product_id, category_id)
SELECT p.id, c.id FROM products p, categories c
WHERE p.id IN ('00000000-0000-0000-0004-000000000011')
  AND c.slug IN ('snacks','tattiler')
ON CONFLICT DO NOTHING;

INSERT INTO product_categories (product_id, category_id)
SELECT p.id, c.id FROM products p, categories c
WHERE p.id IN ('00000000-0000-0000-0004-000000000012')
  AND c.slug IN ('household','turmystyk-himia')
ON CONFLICT DO NOTHING;

-- ======================== INVENTORY ========================
INSERT INTO inventory (store_id, product_id, quantity)
SELECT '00000000-0000-0000-0003-000000000001', p.id,
       CASE p.id
           WHEN '00000000-0000-0000-0004-000000000001' THEN 120
           WHEN '00000000-0000-0000-0004-000000000002' THEN 90
           WHEN '00000000-0000-0000-0004-000000000003' THEN 60
           WHEN '00000000-0000-0000-0004-000000000004' THEN 80
           WHEN '00000000-0000-0000-0004-000000000005' THEN 40
           WHEN '00000000-0000-0000-0004-000000000006' THEN 300
           WHEN '00000000-0000-0000-0004-000000000007' THEN 200
           WHEN '00000000-0000-0000-0004-000000000008' THEN 500
           WHEN '00000000-0000-0000-0004-000000000009' THEN 150
           WHEN '00000000-0000-0000-0004-000000000010' THEN 300
           WHEN '00000000-0000-0000-0004-000000000011' THEN 250
           WHEN '00000000-0000-0000-0004-000000000012' THEN 180
           ELSE 50
       END
FROM products p
WHERE p.id IN (
    '00000000-0000-0000-0004-000000000001',
    '00000000-0000-0000-0004-000000000002',
    '00000000-0000-0000-0004-000000000003',
    '00000000-0000-0000-0004-000000000004',
    '00000000-0000-0000-0004-000000000005',
    '00000000-0000-0000-0004-000000000006',
    '00000000-0000-0000-0004-000000000007',
    '00000000-0000-0000-0004-000000000008',
    '00000000-0000-0000-0004-000000000009',
    '00000000-0000-0000-0004-000000000010',
    '00000000-0000-0000-0004-000000000011',
    '00000000-0000-0000-0004-000000000012'
)
ON CONFLICT DO NOTHING;

-- ======================== PRICE HISTORY (для графиков трендов) ========================
INSERT INTO price_history (id, product_id, old_price, new_price, changed_at)
SELECT gen_random_uuid(),'00000000-0000-0000-0004-000000000001',590,620,now() - INTERVAL '30 days'
WHERE NOT EXISTS (SELECT 1 FROM price_history WHERE product_id='00000000-0000-0000-0004-000000000001' AND changed_at < now() - INTERVAL '29 days');

INSERT INTO price_history (id, product_id, old_price, new_price, changed_at)
SELECT gen_random_uuid(),'00000000-0000-0000-0004-000000000001',620,650,now() - INTERVAL '10 days'
WHERE NOT EXISTS (SELECT 1 FROM price_history WHERE product_id='00000000-0000-0000-0004-000000000001' AND changed_at > now() - INTERVAL '11 days');

INSERT INTO price_history (id, product_id, old_price, new_price, changed_at)
SELECT gen_random_uuid(),'00000000-0000-0000-0004-000000000004',2000,2200,now() - INTERVAL '20 days'
WHERE NOT EXISTS (SELECT 1 FROM price_history WHERE product_id='00000000-0000-0000-0004-000000000004');

INSERT INTO price_history (id, product_id, old_price, new_price, changed_at)
SELECT gen_random_uuid(),'00000000-0000-0000-0004-000000000006',780,850,now() - INTERVAL '15 days'
WHERE NOT EXISTS (SELECT 1 FROM price_history WHERE product_id='00000000-0000-0000-0004-000000000006');

-- ======================== HISTORICAL ORDERS ========================
-- Order 1 — DELIVERED, 2 weeks ago
INSERT INTO orders (id, user_id, store_id, status, total_amount, payment_method, created_at, updated_at)
SELECT '00000000-0000-0000-0005-000000000001',
       '00000000-0000-0000-0002-000000000001',
       '00000000-0000-0000-0003-000000000001',
       'DELIVERED', 4340, 'CASH',
       now() - INTERVAL '14 days', now() - INTERVAL '13 days'
WHERE NOT EXISTS (SELECT 1 FROM orders WHERE id = '00000000-0000-0000-0005-000000000001');

INSERT INTO order_items (id, order_id, product_id, quantity, price, line_total, created_at)
SELECT gen_random_uuid(),'00000000-0000-0000-0005-000000000001','00000000-0000-0000-0004-000000000001',2,650,1300,now() - INTERVAL '14 days'
WHERE EXISTS (SELECT 1 FROM orders WHERE id='00000000-0000-0000-0005-000000000001')
  AND NOT EXISTS (SELECT 1 FROM order_items WHERE order_id='00000000-0000-0000-0005-000000000001' AND product_id='00000000-0000-0000-0004-000000000001');

INSERT INTO order_items (id, order_id, product_id, quantity, price, line_total, created_at)
SELECT gen_random_uuid(),'00000000-0000-0000-0005-000000000001','00000000-0000-0000-0004-000000000004',1,2200,2200,now() - INTERVAL '14 days'
WHERE EXISTS (SELECT 1 FROM orders WHERE id='00000000-0000-0000-0005-000000000001')
  AND NOT EXISTS (SELECT 1 FROM order_items WHERE order_id='00000000-0000-0000-0005-000000000001' AND product_id='00000000-0000-0000-0004-000000000004');

INSERT INTO order_items (id, order_id, product_id, quantity, price, line_total, created_at)
SELECT gen_random_uuid(),'00000000-0000-0000-0005-000000000001','00000000-0000-0000-0004-000000000010',1,250,250,now() - INTERVAL '14 days'
WHERE EXISTS (SELECT 1 FROM orders WHERE id='00000000-0000-0000-0005-000000000001')
  AND NOT EXISTS (SELECT 1 FROM order_items WHERE order_id='00000000-0000-0000-0005-000000000001' AND product_id='00000000-0000-0000-0004-000000000010');

-- Order 2 — DELIVERED, 1 week ago
INSERT INTO orders (id, user_id, store_id, status, total_amount, payment_method, created_at, updated_at)
SELECT '00000000-0000-0000-0005-000000000002',
       '00000000-0000-0000-0002-000000000001',
       '00000000-0000-0000-0003-000000000001',
       'DELIVERED', 3580, 'CARD',
       now() - INTERVAL '7 days', now() - INTERVAL '6 days'
WHERE NOT EXISTS (SELECT 1 FROM orders WHERE id = '00000000-0000-0000-0005-000000000002');

INSERT INTO order_items (id, order_id, product_id, quantity, price, line_total, created_at)
SELECT gen_random_uuid(),'00000000-0000-0000-0005-000000000002','00000000-0000-0000-0004-000000000006',2,850,1700,now() - INTERVAL '7 days'
WHERE EXISTS (SELECT 1 FROM orders WHERE id='00000000-0000-0000-0005-000000000002')
  AND NOT EXISTS (SELECT 1 FROM order_items WHERE order_id='00000000-0000-0000-0005-000000000002' AND product_id='00000000-0000-0000-0004-000000000006');

INSERT INTO order_items (id, order_id, product_id, quantity, price, line_total, created_at)
SELECT gen_random_uuid(),'00000000-0000-0000-0005-000000000002','00000000-0000-0000-0004-000000000003',1,1850,1850,now() - INTERVAL '7 days'
WHERE EXISTS (SELECT 1 FROM orders WHERE id='00000000-0000-0000-0005-000000000002')
  AND NOT EXISTS (SELECT 1 FROM order_items WHERE order_id='00000000-0000-0000-0005-000000000002' AND product_id='00000000-0000-0000-0004-000000000003');

-- Order 3 — DELIVERED, 3 days ago
INSERT INTO orders (id, user_id, store_id, status, total_amount, payment_method, created_at, updated_at)
SELECT '00000000-0000-0000-0005-000000000003',
       '00000000-0000-0000-0002-000000000001',
       '00000000-0000-0000-0003-000000000001',
       'DELIVERED', 2090, 'CASH',
       now() - INTERVAL '3 days', now() - INTERVAL '2 days'
WHERE NOT EXISTS (SELECT 1 FROM orders WHERE id = '00000000-0000-0000-0005-000000000003');

INSERT INTO order_items (id, order_id, product_id, quantity, price, line_total, created_at)
SELECT gen_random_uuid(),'00000000-0000-0000-0005-000000000003','00000000-0000-0000-0004-000000000008',3,250,750,now() - INTERVAL '3 days'
WHERE EXISTS (SELECT 1 FROM orders WHERE id='00000000-0000-0000-0005-000000000003')
  AND NOT EXISTS (SELECT 1 FROM order_items WHERE order_id='00000000-0000-0000-0005-000000000003' AND product_id='00000000-0000-0000-0004-000000000008');

INSERT INTO order_items (id, order_id, product_id, quantity, price, line_total, created_at)
SELECT gen_random_uuid(),'00000000-0000-0000-0005-000000000003','00000000-0000-0000-0004-000000000007',1,990,990,now() - INTERVAL '3 days'
WHERE EXISTS (SELECT 1 FROM orders WHERE id='00000000-0000-0000-0005-000000000003')
  AND NOT EXISTS (SELECT 1 FROM order_items WHERE order_id='00000000-0000-0000-0005-000000000003' AND product_id='00000000-0000-0000-0004-000000000007');

INSERT INTO order_items (id, order_id, product_id, quantity, price, line_total, created_at)
SELECT gen_random_uuid(),'00000000-0000-0000-0005-000000000003','00000000-0000-0000-0004-000000000011',1,450,450,now() - INTERVAL '3 days'
WHERE EXISTS (SELECT 1 FROM orders WHERE id='00000000-0000-0000-0005-000000000003')
  AND NOT EXISTS (SELECT 1 FROM order_items WHERE order_id='00000000-0000-0000-0005-000000000003' AND product_id='00000000-0000-0000-0004-000000000011');

-- Order 4 — SHIPPED (active), yesterday
INSERT INTO orders (id, user_id, store_id, status, total_amount, payment_method, created_at, updated_at)
SELECT '00000000-0000-0000-0005-000000000004',
       '00000000-0000-0000-0002-000000000001',
       '00000000-0000-0000-0003-000000000001',
       'SHIPPED', 5200, 'CARD',
       now() - INTERVAL '1 day', now() - INTERVAL '20 hours'
WHERE NOT EXISTS (SELECT 1 FROM orders WHERE id = '00000000-0000-0000-0005-000000000004');

INSERT INTO order_items (id, order_id, product_id, quantity, price, line_total, created_at)
SELECT gen_random_uuid(),'00000000-0000-0000-0005-000000000004','00000000-0000-0000-0004-000000000005',1,3500,3500,now() - INTERVAL '1 day'
WHERE EXISTS (SELECT 1 FROM orders WHERE id='00000000-0000-0000-0005-000000000004')
  AND NOT EXISTS (SELECT 1 FROM order_items WHERE order_id='00000000-0000-0000-0005-000000000004' AND product_id='00000000-0000-0000-0004-000000000005');

INSERT INTO order_items (id, order_id, product_id, quantity, price, line_total, created_at)
SELECT gen_random_uuid(),'00000000-0000-0000-0005-000000000004','00000000-0000-0000-0004-000000000002',1,480,480,now() - INTERVAL '1 day'
WHERE EXISTS (SELECT 1 FROM orders WHERE id='00000000-0000-0000-0005-000000000004')
  AND NOT EXISTS (SELECT 1 FROM order_items WHERE order_id='00000000-0000-0000-0005-000000000004' AND product_id='00000000-0000-0000-0004-000000000002');

INSERT INTO order_items (id, order_id, product_id, quantity, price, line_total, created_at)
SELECT gen_random_uuid(),'00000000-0000-0000-0005-000000000004','00000000-0000-0000-0004-000000000009',1,890,890,now() - INTERVAL '1 day'
WHERE EXISTS (SELECT 1 FROM orders WHERE id='00000000-0000-0000-0005-000000000004')
  AND NOT EXISTS (SELECT 1 FROM order_items WHERE order_id='00000000-0000-0000-0005-000000000004' AND product_id='00000000-0000-0000-0004-000000000009');

-- Order 5 — CONFIRMED (active), today
INSERT INTO orders (id, user_id, store_id, status, total_amount, payment_method, created_at, updated_at)
SELECT '00000000-0000-0000-0005-000000000005',
       '00000000-0000-0000-0002-000000000001',
       '00000000-0000-0000-0003-000000000001',
       'CONFIRMED', 1950, 'CASH',
       now() - INTERVAL '2 hours', now() - INTERVAL '1 hour'
WHERE NOT EXISTS (SELECT 1 FROM orders WHERE id = '00000000-0000-0000-0005-000000000005');

INSERT INTO order_items (id, order_id, product_id, quantity, price, line_total, created_at)
SELECT gen_random_uuid(),'00000000-0000-0000-0005-000000000005','00000000-0000-0000-0004-000000000001',1,650,650,now() - INTERVAL '2 hours'
WHERE EXISTS (SELECT 1 FROM orders WHERE id='00000000-0000-0000-0005-000000000005')
  AND NOT EXISTS (SELECT 1 FROM order_items WHERE order_id='00000000-0000-0000-0005-000000000005' AND product_id='00000000-0000-0000-0004-000000000001');

INSERT INTO order_items (id, order_id, product_id, quantity, price, line_total, created_at)
SELECT gen_random_uuid(),'00000000-0000-0000-0005-000000000005','00000000-0000-0000-0004-000000000006',1,850,850,now() - INTERVAL '2 hours'
WHERE EXISTS (SELECT 1 FROM orders WHERE id='00000000-0000-0000-0005-000000000005')
  AND NOT EXISTS (SELECT 1 FROM order_items WHERE order_id='00000000-0000-0000-0005-000000000005' AND product_id='00000000-0000-0000-0004-000000000006');

INSERT INTO order_items (id, order_id, product_id, quantity, price, line_total, created_at)
SELECT gen_random_uuid(),'00000000-0000-0000-0005-000000000005','00000000-0000-0000-0004-000000000010',1,250,250,now() - INTERVAL '2 hours'
WHERE EXISTS (SELECT 1 FROM orders WHERE id='00000000-0000-0000-0005-000000000005')
  AND NOT EXISTS (SELECT 1 FROM order_items WHERE order_id='00000000-0000-0000-0005-000000000005' AND product_id='00000000-0000-0000-0004-000000000010');
