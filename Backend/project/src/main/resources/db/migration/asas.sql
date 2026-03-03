create table if not exists stores (
                                      id uuid primary key default gen_random_uuid(),
    name varchar(150) not null,
    address text,
    active boolean not null default true,
    created_at timestamptz not null default now(),
    updated_at timestamptz
    );

create index if not exists idx_stores_active on stores(active);


create table if not exists inventory (
                                         store_id uuid not null references stores(id) on delete cascade,
    product_id uuid not null references products(id) on delete cascade,
    quantity int not null check (quantity >= 0),
    updated_at timestamptz,
    primary key (store_id, product_id)
    );

create index if not exists idx_inventory_product on inventory(product_id);


alter table carts add column if not exists store_id uuid references stores(id);

-- убираем старый unique
drop index if exists carts_user_id_key; -- имя может отличаться
-- если был constraint:
alter table carts drop constraint if exists carts_user_id_key;

-- делаем уникальность по (user, store)
create unique index if not exists uq_carts_user_store on carts(user_id, store_id);
create index if not exists idx_carts_store on carts(store_id);


alter table orders add column if not exists store_id uuid references stores(id);
create index if not exists idx_orders_store on orders(store_id);

alter table orders alter column store_id set not null;


