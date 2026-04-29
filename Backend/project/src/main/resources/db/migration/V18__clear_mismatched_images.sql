-- ============================================================
-- V18: Clear mismatched / unreliable Unsplash images.
--
-- Reason: Unsplash photo IDs are not curated for an exact product
-- match (e.g. a "Кефир 1л" search returned a generic dairy photo
-- that occasionally renders as something unrelated). The frontend
-- has a deterministic per-category PNG fallback in
-- `frontend/src/components/ProductImage.tsx` that picks an
-- appropriate icon based on the product's top-level category, so
-- nullifying these URLs guarantees every card shows a correct
-- category-matching image.
--
-- Scope: only the V17 batch (barcodes starting with 4870017). Older
-- seed products from V3 keep whatever they had.
-- ============================================================

UPDATE products
SET image_url = NULL
WHERE barcode LIKE '4870017%'
  AND image_url LIKE 'https://images.unsplash.com/%';
