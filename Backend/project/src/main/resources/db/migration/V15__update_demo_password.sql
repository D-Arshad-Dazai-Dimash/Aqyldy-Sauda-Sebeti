-- ============================================================
-- V15: Set demo passwords to 'password'
--      Uses BCrypt hash with cost=10
--      Password: password
--      This hash is from Spring Security documentation examples
-- ============================================================

UPDATE users SET password_hash = '$2a$10$dXJ3SW6G7P50eexJiMY6K.6e52sKX6lkP45s3T3gS6hG7fv8lVtEe'
WHERE email = 'demo@merchant.kz';

UPDATE users SET password_hash = '$2a$10$dXJ3SW6G7P50eexJiMY6K.6e52sKX6lkP45s3T3gS6hG7fv8lVtEe'
WHERE email = 'demo@buyer.kz';
