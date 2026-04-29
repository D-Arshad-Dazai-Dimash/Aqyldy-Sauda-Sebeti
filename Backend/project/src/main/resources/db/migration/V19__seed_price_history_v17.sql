-- V19: Synthesize 30 days of price_history for V17 catalog products.
--
-- The 14-day price-trend forecast (ai-service/services/price_trend_service.py)
-- needs at least ~5 historical points per product to produce a meaningful
-- linear regression. V17 inserted 160 fresh products with no price changes,
-- so the trend chart on every product page falls back to a flat 3-day "low
-- confidence" line. To make the demo / presentation convincing, we backfill
-- each V17 product with a small synthetic history:
--
--   day -29   base price + small jitter   (oldest)
--   day -22   small ±5 % wobble
--   day -14   small ±5 % wobble
--   day  -7   small ±5 % wobble
--   day  -2   current price (most recent change)
--
-- Idempotent: only inserts when no history exists for the product yet.

INSERT INTO price_history (id, product_id, old_price, new_price, changed_at)
SELECT
    gen_random_uuid(),
    p.id,
    ROUND(p.price * (0.92 + (random() * 0.08))),  -- old_price ~ 92-100% of base
    ROUND(p.price * (0.94 + (random() * 0.06))),  -- new_price ~ 94-100% of base
    NOW() - INTERVAL '29 days'
FROM products p
WHERE p.id::text LIKE '00000000-0017-%'
  AND NOT EXISTS (
      SELECT 1 FROM price_history h WHERE h.product_id = p.id
  );

INSERT INTO price_history (id, product_id, old_price, new_price, changed_at)
SELECT
    gen_random_uuid(),
    p.id,
    ROUND(p.price * (0.94 + (random() * 0.06))),
    ROUND(p.price * (0.96 + (random() * 0.05))),
    NOW() - INTERVAL '22 days'
FROM products p
WHERE p.id::text LIKE '00000000-0017-%'
  AND (SELECT COUNT(*) FROM price_history h WHERE h.product_id = p.id) = 1;

INSERT INTO price_history (id, product_id, old_price, new_price, changed_at)
SELECT
    gen_random_uuid(),
    p.id,
    ROUND(p.price * (0.96 + (random() * 0.05))),
    ROUND(p.price * (0.97 + (random() * 0.05))),
    NOW() - INTERVAL '14 days'
FROM products p
WHERE p.id::text LIKE '00000000-0017-%'
  AND (SELECT COUNT(*) FROM price_history h WHERE h.product_id = p.id) = 2;

INSERT INTO price_history (id, product_id, old_price, new_price, changed_at)
SELECT
    gen_random_uuid(),
    p.id,
    ROUND(p.price * (0.97 + (random() * 0.05))),
    ROUND(p.price * (0.98 + (random() * 0.04))),
    NOW() - INTERVAL '7 days'
FROM products p
WHERE p.id::text LIKE '00000000-0017-%'
  AND (SELECT COUNT(*) FROM price_history h WHERE h.product_id = p.id) = 3;

-- Most recent change: lock the value to current price so the trend's tail
-- exactly matches what shoppers see on the product page today.
INSERT INTO price_history (id, product_id, old_price, new_price, changed_at)
SELECT
    gen_random_uuid(),
    p.id,
    ROUND(p.price * (0.98 + (random() * 0.04))),
    p.price,
    NOW() - INTERVAL '2 days'
FROM products p
WHERE p.id::text LIKE '00000000-0017-%'
  AND (SELECT COUNT(*) FROM price_history h WHERE h.product_id = p.id) = 4;
