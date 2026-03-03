create extension if not exists "pgcrypto";

create table if not exists orders (
                                      id uuid primary key default gen_random_uuid(),
    user_id uuid not null references users(id) on delete cascade,

    status varchar(30) not null default 'CREATED',
    total_amount numeric(12,2) not null default 0,

    delivery_address text,
    comment text,

    created_at timestamptz not null default now(),
    updated_at timestamptz
    );

create index if not exists idx_orders_user_id on orders(user_id);
create index if not exists idx_orders_status on orders(status);

create table if not exists order_items (
                                           id uuid primary key default gen_random_uuid(),
    order_id uuid not null references orders(id) on delete cascade,
    product_id uuid not null references products(id),

    quantity int not null check (quantity > 0),
    price numeric(12,2) not null,
    line_total numeric(12,2) not null,

    created_at timestamptz not null default now()
    );

create index if not exists idx_order_items_order_id on order_items(order_id);