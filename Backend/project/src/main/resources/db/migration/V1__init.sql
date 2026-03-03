-- =========================
-- EXTENSIONS
-- =========================
create extension if not exists "pgcrypto";

-- =========================
-- USERS
-- =========================
create table if not exists users (
                                     id uuid primary key default gen_random_uuid(),

                                     email varchar(255) not null unique,
                                     password_hash varchar(255) not null,
                                     role varchar(50) not null,

                                     enabled boolean not null default true,

                                     created_at timestamptz not null default now(),
                                     updated_at timestamptz
);

create index if not exists idx_users_email on users(email);
-- Extensions
create extension if not exists "pgcrypto";

-- Categories
create table if not exists categories (
                                          id uuid primary key default gen_random_uuid(),
                                          name varchar(120) not null,
                                          slug varchar(140) not null unique,
                                          created_at timestamptz not null default now(),
                                          updated_at timestamptz
);

-- Products
create table if not exists products (
                                        id uuid primary key default gen_random_uuid(),
                                        title varchar(180) not null,
                                        description text,
                                        price numeric(12,2) not null,
                                        image_url text,
                                        active boolean not null default true,
                                        created_at timestamptz not null default now(),
                                        updated_at timestamptz
);

-- Product <-> Category (many-to-many)
create table if not exists product_categories (
                                                  product_id uuid not null references products(id) on delete cascade,
                                                  category_id uuid not null references categories(id) on delete cascade,
                                                  primary key (product_id, category_id)
);

create index if not exists idx_products_active on products(active);
create index if not exists idx_products_title on products(title);
create index if not exists idx_pc_category on product_categories(category_id);