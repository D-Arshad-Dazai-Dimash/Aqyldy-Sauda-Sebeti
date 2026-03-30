-- ============================================================
-- V2: Schema redesign — fix mismatches, add indexes, new tables
-- ============================================================

-- ======================== USERS ========================
-- Add profile fields (name, phone, avatar)
ALTER TABLE users ADD COLUMN IF NOT EXISTS name VARCHAR(150);
ALTER TABLE users ADD COLUMN IF NOT EXISTS phone VARCHAR(20);
ALTER TABLE users ADD COLUMN IF NOT EXISTS avatar_url TEXT;

CREATE INDEX IF NOT EXISTS idx_users_email ON users (email);

-- ======================== STORES ========================
-- Add richer store info (description, phone, logo, working hours)
ALTER TABLE stores ADD COLUMN IF NOT EXISTS description TEXT;
ALTER TABLE stores ADD COLUMN IF NOT EXISTS phone VARCHAR(20);
ALTER TABLE stores ADD COLUMN IF NOT EXISTS logo_url TEXT;
ALTER TABLE stores ADD COLUMN IF NOT EXISTS working_hours VARCHAR(100);

CREATE INDEX IF NOT EXISTS idx_stores_active ON stores (active);

-- ======================== CATEGORIES ========================
-- Fix: add slug, created_at, updated_at that entities expect but migration missed
ALTER TABLE categories ADD COLUMN IF NOT EXISTS slug VARCHAR(140);
ALTER TABLE categories ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ NOT NULL DEFAULT now();
ALTER TABLE categories ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ;

-- Populate slug from name for existing rows (lowercase, replace spaces with -)
UPDATE categories SET slug = LOWER(REPLACE(name, ' ', '-')) WHERE slug IS NULL;

-- Now enforce NOT NULL and UNIQUE
ALTER TABLE categories ALTER COLUMN slug SET NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS idx_categories_slug ON categories (slug);

-- ======================== PRODUCTS ========================
-- Add unit field (kg, piece, litre, pack)
ALTER TABLE products ADD COLUMN IF NOT EXISTS unit VARCHAR(20) DEFAULT 'piece';
-- Add weight/volume for display (e.g. "1L", "500g")
ALTER TABLE products ADD COLUMN IF NOT EXISTS weight VARCHAR(30);

CREATE INDEX IF NOT EXISTS idx_products_barcode ON products (barcode);
CREATE INDEX IF NOT EXISTS idx_products_active ON products (active);
CREATE INDEX IF NOT EXISTS idx_products_title ON products USING gin (to_tsvector('simple', title));

-- ======================== PRODUCT_CATEGORIES ========================
CREATE INDEX IF NOT EXISTS idx_prodcat_product ON product_categories (product_id);
CREATE INDEX IF NOT EXISTS idx_prodcat_category ON product_categories (category_id);

-- ======================== INVENTORY ========================
CREATE INDEX IF NOT EXISTS idx_inventory_store ON inventory (store_id);
CREATE INDEX IF NOT EXISTS idx_inventory_product ON inventory (product_id);

-- ======================== CARTS ========================
-- Fix: add created_at, updated_at that entities expect but migration missed
ALTER TABLE carts ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ NOT NULL DEFAULT now();
ALTER TABLE carts ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ;

-- One cart per user per store
CREATE UNIQUE INDEX IF NOT EXISTS uq_carts_user_store ON carts (user_id, store_id);

CREATE INDEX IF NOT EXISTS idx_carts_user ON carts (user_id);
CREATE INDEX IF NOT EXISTS idx_carts_store ON carts (store_id);

-- ======================== CART_ITEMS ========================
-- One product per cart
CREATE UNIQUE INDEX IF NOT EXISTS uq_cart_product ON cart_items (cart_id, product_id);

CREATE INDEX IF NOT EXISTS idx_cartitems_cart ON cart_items (cart_id);
CREATE INDEX IF NOT EXISTS idx_cartitems_product ON cart_items (product_id);

-- ======================== ORDERS ========================
CREATE INDEX IF NOT EXISTS idx_orders_user ON orders (user_id);
CREATE INDEX IF NOT EXISTS idx_orders_store ON orders (store_id);
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders (status);
CREATE INDEX IF NOT EXISTS idx_orders_created ON orders (created_at DESC);

-- ======================== ORDER_ITEMS ========================
CREATE INDEX IF NOT EXISTS idx_orderitems_order ON order_items (order_id);
CREATE INDEX IF NOT EXISTS idx_orderitems_product ON order_items (product_id);

-- ======================== NEW: FAVORITES ========================
-- Server-side favorites so they sync across devices
CREATE TABLE IF NOT EXISTS favorites (
    id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id    UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),

    UNIQUE (user_id, product_id)
);

CREATE INDEX IF NOT EXISTS idx_favorites_user ON favorites (user_id);
CREATE INDEX IF NOT EXISTS idx_favorites_product ON favorites (product_id);

-- ======================== NEW: PRICE HISTORY ========================
-- Track product price changes for analytics / "was X, now Y" display
CREATE TABLE IF NOT EXISTS price_history (
    id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    old_price  DECIMAL(12,2) NOT NULL,
    new_price  DECIMAL(12,2) NOT NULL,
    changed_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_pricehist_product ON price_history (product_id);
CREATE INDEX IF NOT EXISTS idx_pricehist_date ON price_history (changed_at DESC);

-- ======================== UPDATE SEED DATA ========================
-- Update category slugs for seed rows (already done by UPDATE above)
-- Add working_hours for seed stores
UPDATE stores SET working_hours = '08:00-23:00', description = 'Supermarket chain' WHERE working_hours IS NULL;
