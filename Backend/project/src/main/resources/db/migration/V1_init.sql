create table if not exists users (
                                     id bigserial primary key,
                                     email varchar(255) unique not null,
    password_hash varchar(255) not null,
    role varchar(50) not null default 'USER',
    created_at timestamptz not null default now()
    );