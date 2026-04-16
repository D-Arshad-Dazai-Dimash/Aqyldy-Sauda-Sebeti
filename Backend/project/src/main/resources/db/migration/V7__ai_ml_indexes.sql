-- =====================================================
-- V7: Indexes to support AI/ML features
-- (recommendations, analytics, price insights)
-- =====================================================

CREATE INDEX IF NOT EXISTS idx_order_items_product_id
    ON order_items (product_id);

CREATE INDEX IF NOT EXISTS idx_order_items_order_id
    ON order_items (order_id);

CREATE INDEX IF NOT EXISTS idx_orders_user_created
    ON orders (user_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_price_history_product_changed
    ON price_history (product_id, changed_at DESC);
