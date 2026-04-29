-- ============================================================
-- V16: Real-world store coordinates (Almaty + Astana)
--
-- Why: V10 added latitude/longitude columns but the stores seeded
-- in V3 / V13 were never populated, so MapScreen.tsx silently
-- filtered every store out (see "withCoords" filter in
-- frontend/src/screens/MapScreen.tsx).
--
-- This migration:
--   1. Backfills coordinates for the four pre-existing stores.
--   2. Inserts ~10 well-known grocery chain locations across
--      Almaty and Astana so the map looks alive out of the box.
--
-- All coordinates are public, well-known addresses; no private
-- data. Owner_id is NULL since these are platform-curated demo
-- locations, not merchant-owned.
-- ============================================================

-- 1) Backfill existing seed stores ---------------------------

UPDATE stores SET latitude = 43.2355, longitude = 76.9477
 WHERE name = 'Magnum'   AND latitude IS NULL;

UPDATE stores SET latitude = 43.2478, longitude = 76.9165
 WHERE name = 'Small'    AND latitude IS NULL;

UPDATE stores SET latitude = 43.2340, longitude = 76.8925
 WHERE name = 'FixPrice' AND latitude IS NULL;

UPDATE stores SET latitude = 43.2385, longitude = 76.8752
 WHERE name = 'Alatau Market' AND latitude IS NULL;

-- 2) Seed extra well-known chain stores ---------------------

-- Almaty -----------------------------------------------------

INSERT INTO stores (id, name, address, description, phone, logo_url,
                    working_hours, active, latitude, longitude, created_at)
SELECT gen_random_uuid(), 'Magnum Mega', 'пр. Розыбакиева 247А, Алматы',
       'Гипермаркет в ТРЦ Mega Park', '+7 727 311 18 18', NULL,
       '08:00-23:00', true, 43.2218, 76.8909, now()
 WHERE NOT EXISTS (
    SELECT 1 FROM stores WHERE name = 'Magnum Mega'
       AND address = 'пр. Розыбакиева 247А, Алматы'
 );

INSERT INTO stores (id, name, address, description, phone, logo_url,
                    working_hours, active, latitude, longitude, created_at)
SELECT gen_random_uuid(), 'Galmart', 'ул. Маметовой 94, Алматы',
       'Локальная сеть супермаркетов', '+7 727 250 11 22', NULL,
       '08:00-22:00', true, 43.2616, 76.9300, now()
 WHERE NOT EXISTS (
    SELECT 1 FROM stores WHERE name = 'Galmart'
       AND address = 'ул. Маметовой 94, Алматы'
 );

INSERT INTO stores (id, name, address, description, phone, logo_url,
                    working_hours, active, latitude, longitude, created_at)
SELECT gen_random_uuid(), 'Anvar', 'ул. Ауэзова 52, Алматы',
       'Дискаунтер у дома', '+7 727 311 30 30', NULL,
       '08:00-23:00', true, 43.2541, 76.9102, now()
 WHERE NOT EXISTS (
    SELECT 1 FROM stores WHERE name = 'Anvar'
       AND address = 'ул. Ауэзова 52, Алматы'
 );

INSERT INTO stores (id, name, address, description, phone, logo_url,
                    working_hours, active, latitude, longitude, created_at)
SELECT gen_random_uuid(), 'Dastarkhan', 'ул. Байзак батыра 91, Алматы',
       'Гипермаркет', '+7 727 232 22 22', NULL,
       '08:00-23:00', true, 43.2302, 76.8751, now()
 WHERE NOT EXISTS (
    SELECT 1 FROM stores WHERE name = 'Dastarkhan'
       AND address = 'ул. Байзак батыра 91, Алматы'
 );

-- Astana -----------------------------------------------------

INSERT INTO stores (id, name, address, description, phone, logo_url,
                    working_hours, active, latitude, longitude, created_at)
SELECT gen_random_uuid(), 'Magnum Astana', 'пр. Кабанбай батыра 21, Астана',
       'Гипермаркет в столице', '+7 7172 700 700', NULL,
       '08:00-23:00', true, 51.1281, 71.4304, now()
 WHERE NOT EXISTS (
    SELECT 1 FROM stores WHERE name = 'Magnum Astana'
       AND address = 'пр. Кабанбай батыра 21, Астана'
 );

INSERT INTO stores (id, name, address, description, phone, logo_url,
                    working_hours, active, latitude, longitude, created_at)
SELECT gen_random_uuid(), 'Anvar Astana', 'ул. Сыганак 10, Астана',
       'Дискаунтер у дома', '+7 7172 555 333', NULL,
       '08:00-23:00', true, 51.1278, 71.4225, now()
 WHERE NOT EXISTS (
    SELECT 1 FROM stores WHERE name = 'Anvar Astana'
       AND address = 'ул. Сыганак 10, Астана'
 );

INSERT INTO stores (id, name, address, description, phone, logo_url,
                    working_hours, active, latitude, longitude, created_at)
SELECT gen_random_uuid(), 'Galmart Astana', 'пр. Тауелсиздик 33, Астана',
       'Сеть супермаркетов', '+7 7172 200 100', NULL,
       '08:00-22:00', true, 51.1521, 71.4301, now()
 WHERE NOT EXISTS (
    SELECT 1 FROM stores WHERE name = 'Galmart Astana'
       AND address = 'пр. Тауелсиздик 33, Астана'
 );

INSERT INTO stores (id, name, address, description, phone, logo_url,
                    working_hours, active, latitude, longitude, created_at)
SELECT gen_random_uuid(), 'Dastarkhan Astana', 'пр. Республики 5, Астана',
       'Гипермаркет', '+7 7172 333 444', NULL,
       '08:00-23:00', true, 51.1605, 71.4500, now()
 WHERE NOT EXISTS (
    SELECT 1 FROM stores WHERE name = 'Dastarkhan Astana'
       AND address = 'пр. Республики 5, Астана'
 );

-- Confirm at least one store now has coordinates so MapScreen
-- isn't empty even if all UPDATEs above were skipped.
DO $$
DECLARE
    n integer;
BEGIN
    SELECT count(*) INTO n FROM stores
     WHERE latitude IS NOT NULL AND longitude IS NOT NULL;
    IF n = 0 THEN
        RAISE EXCEPTION 'V16 left every store without coordinates';
    END IF;
END $$;
