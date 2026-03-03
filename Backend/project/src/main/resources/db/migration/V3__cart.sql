create extension if not exists "pgcrypto";

create table if not exists carts (
                                     id uuid primary key default gen_random_uuid(),
    user_id uuid not null unique references users(id) on delete cascade,
    created_at timestamptz not null default now(),
    updated_at timestamptz
    );

create table if not exists cart_items (
                                          id uuid primary key default gen_random_uuid(),
    cart_id uuid not null references carts(id) on delete cascade,
    product_id uuid not null references products(id),
    quantity int not null check (quantity > 0),
    created_at timestamptz not null default now(),
    updated_at timestamptz
    );

create unique index if not exists uq_cart_product on cart_items(cart_id, product_id);
create index if not exists idx_cart_items_cart_id on cart_items(cart_id);