create extension if not exists "pgcrypto";

-- =========================
-- CATEGORIES
-- =========================
insert into categories (id, name, slug, created_at)
values
    (gen_random_uuid(), 'Молочные продукты', 'dairy', now()),
    (gen_random_uuid(), 'Хлеб и выпечка', 'bakery', now()),
    (gen_random_uuid(), 'Напитки', 'drinks', now()),
    (gen_random_uuid(), 'Фрукты и овощи', 'fruits-veg', now()),
    (gen_random_uuid(), 'Мясо и птица', 'meat', now()),
    (gen_random_uuid(), 'Снеки', 'snacks', now())
on conflict (slug) do nothing;

-- =========================
-- PRODUCTS
-- (active вместо available)
-- =========================
insert into products (id, title, description, price, image_url, active, created_at)
select gen_random_uuid(),
       v.title,
       v.description,
       v.price,
       v.image_url,
       true,
       now()
from (values
          ('Молоко 2.5% 1л', 'Пастеризованное молоко 1 литр', 549.00, 'https://picsum.photos/seed/milk/600/600'),
          ('Кефир 2.5% 1л', 'Кефир 1 литр', 599.00, 'https://picsum.photos/seed/kefir/600/600'),
          ('Йогурт клубничный 150г', 'Йогурт порционный', 249.00, 'https://picsum.photos/seed/yogurt/600/600'),

          ('Хлеб белый', 'Свежий хлеб', 199.00, 'https://picsum.photos/seed/bread/600/600'),
          ('Батон нарезной', 'Батон классический', 219.00, 'https://picsum.photos/seed/baton/600/600'),

          ('Coca-Cola 1л', 'Газированный напиток', 499.00, 'https://picsum.photos/seed/cola/600/600'),
          ('Вода негазированная 1.5л', 'Питьевая вода', 299.00, 'https://picsum.photos/seed/water/600/600'),

          ('Яблоки 1кг', 'Свежие яблоки', 899.00, 'https://picsum.photos/seed/apples/600/600'),
          ('Бананы 1кг', 'Спелые бананы', 999.00, 'https://picsum.photos/seed/bananas/600/600'),
          ('Огурцы 1кг', 'Огурцы свежие', 1099.00, 'https://picsum.photos/seed/cucumber/600/600'),

          ('Куриное филе 1кг', 'Охлажденное филе', 2499.00, 'https://picsum.photos/seed/chicken/600/600'),
          ('Говядина 1кг', 'Говядина охлажденная', 4599.00, 'https://picsum.photos/seed/beef/600/600'),

          ('Чипсы 140г', 'Картофельные чипсы', 699.00, 'https://picsum.photos/seed/chips/600/600'),
          ('Шоколад 90г', 'Шоколад плиточный', 499.00, 'https://picsum.photos/seed/choco/600/600')
     ) as v(title, description, price, image_url)
where not exists (
    select 1 from products p where lower(p.title) = lower(v.title)
);

-- =========================
-- PRODUCT <-> CATEGORY LINKS
-- =========================

-- dairy
insert into product_categories (product_id, category_id)
select p.id, c.id
from products p
         join categories c on c.slug = 'dairy'
where p.title in ('Молоко 2.5% 1л', 'Кефир 2.5% 1л', 'Йогурт клубничный 150г')
on conflict do nothing;

-- bakery
insert into product_categories (product_id, category_id)
select p.id, c.id
from products p
         join categories c on c.slug = 'bakery'
where p.title in ('Хлеб белый', 'Батон нарезной')
on conflict do nothing;

-- drinks
insert into product_categories (product_id, category_id)
select p.id, c.id
from products p
         join categories c on c.slug = 'drinks'
where p.title in ('Coca-Cola 1л', 'Вода негазированная 1.5л')
on conflict do nothing;

-- fruits-veg
insert into product_categories (product_id, category_id)
select p.id, c.id
from products p
         join categories c on c.slug = 'fruits-veg'
where p.title in ('Яблоки 1кг', 'Бананы 1кг', 'Огурцы 1кг')
on conflict do nothing;

-- meat
insert into product_categories (product_id, category_id)
select p.id, c.id
from products p
         join categories c on c.slug = 'meat'
where p.title in ('Куриное филе 1кг', 'Говядина 1кг')
on conflict do nothing;

-- snacks
insert into product_categories (product_id, category_id)
select p.id, c.id
from products p
         join categories c on c.slug = 'snacks'
where p.title in ('Чипсы 140г', 'Шоколад 90г')
on conflict do nothing;