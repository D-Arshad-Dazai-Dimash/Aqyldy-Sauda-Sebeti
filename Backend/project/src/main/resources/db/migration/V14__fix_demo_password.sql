-- ============================================================
-- V14: Fix demo user passwords
--      Using correct BCrypt hash for 'test123'
--      Generated with cost=10
-- ============================================================

UPDATE users SET password_hash = '$2a$10$vfm6BdKfhqKaF3Zz9yJUP.EgCaI6VNHuEVkWmKVWiG2WGU6Hgq.3'
WHERE email = 'demo@merchant.kz';

UPDATE users SET password_hash = '$2a$10$vfm6BdKfhqKaF3Zz9yJUP.EgCaI6VNHuEVkWmKVWiG2WGU6Hgq.3'
WHERE email = 'demo@buyer.kz';
