-- ============================================================
-- V14: Fix demo user passwords with correct BCrypt hash
--      Password: demo1234
--      BCrypt cost: 10
--      Proper hash: $2a$10$qUF0Z5C6u3bWnhCOPYiLVeH8gVEFxJh.wkLlL4TIW7z5KGt8gNi4G
-- ============================================================

UPDATE users SET password_hash = '$2a$10$qUF0Z5C6u3bWnhCOPYiLVeH8gVEFxJh.wkLlL4TIW7z5KGt8gNi4G'
WHERE email = 'demo@merchant.kz';

UPDATE users SET password_hash = '$2a$10$qUF0Z5C6u3bWnhCOPYiLVeH8gVEFxJh.wkLlL4TIW7z5KGt8gNi4G'
WHERE email = 'demo@buyer.kz';
