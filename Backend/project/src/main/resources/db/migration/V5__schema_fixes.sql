-- ============================================================
-- V5: Schema integrity fixes
-- ============================================================
-- Goals:
--   D1) Make products.barcode NOT NULL to match the JPA entity
--       (Product.java declares nullable = false). Without this the
--       schema and entity disagree and inserts of nulls are silently
--       allowed at the DB level.
--   D2) Ensure inventory.store_id and inventory.product_id foreign
--       keys are ON DELETE CASCADE so a deleted store/product cannot
--       leave orphan inventory rows.
--
-- Notes:
--   * V1 cannot be edited because it has already been applied in
--     team and dev databases — Flyway would fail on a checksum
--     mismatch. So this is a forward-only migration.
--   * The DO $$ block dynamically discovers existing FK constraint
--     names via pg_constraint, so this works regardless of how the
--     constraints were originally named (Postgres auto-naming can
--     vary between versions).
--   * Operations are idempotent: re-running the migration on a
--     database that already has the fixes is a no-op.
-- ============================================================

-- ---------- D1: products.barcode NOT NULL --------------------
-- Defensive backfill: any legacy rows with a NULL barcode get
-- the row UUID coerced to text, so the NOT NULL constraint can
-- be added without losing data.
UPDATE products
SET barcode = id::text
WHERE barcode IS NULL;

ALTER TABLE products
    ALTER COLUMN barcode SET NOT NULL;

-- ---------- D2: inventory FK ON DELETE CASCADE ---------------
-- Drop whatever FK constraints currently exist on inventory's
-- store_id and product_id columns, then re-create them with
-- ON DELETE CASCADE. We use pg_constraint to find the actual
-- constraint names rather than hard-coding them.
DO $$
DECLARE
    cons_name TEXT;
BEGIN
    FOR cons_name IN
        SELECT conname
        FROM pg_constraint
        WHERE conrelid = 'inventory'::regclass
          AND contype  = 'f'
    LOOP
        EXECUTE 'ALTER TABLE inventory DROP CONSTRAINT ' || quote_ident(cons_name);
    END LOOP;
END $$;

ALTER TABLE inventory
    ADD CONSTRAINT inventory_store_id_fkey
    FOREIGN KEY (store_id) REFERENCES stores(id) ON DELETE CASCADE;

ALTER TABLE inventory
    ADD CONSTRAINT inventory_product_id_fkey
    FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE;
