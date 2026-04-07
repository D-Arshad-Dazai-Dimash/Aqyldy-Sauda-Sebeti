-- ============================================================
-- V6: Schema additions for B7 (cart price snapshot),
--     B11 (refresh tokens) and B13 (password reset tokens).
-- ============================================================
-- Goals:
--   B7) Snapshot the effective unit price on the cart_items row at
--       the moment the item is added. Today the cart total is
--       recomputed from the live product price, so a merchant
--       price change between "add to cart" and "checkout" silently
--       changes what the user sees. Snapshotting on add freezes
--       the cart UX (and the order line later mirrors the same).
--       Column is nullable so old rows are still valid; new rows
--       will always populate it (CartService sets it on add).
--
--   B11) refresh_tokens table for long-lived refresh tokens. The
--        access JWT remains short-lived (60min), and the client
--        exchanges a refresh token for a new access token via
--        POST /api/auth/refresh. Tokens are stored hashed (sha256
--        hex) so a DB leak does not directly hand out valid
--        refresh tokens.
--
--   B13) password_reset_tokens table for forgot/reset-password
--        flow. Tokens are single-use; the consumed_at column lets
--        us reject reuse. Tokens are also stored hashed.
--
-- Notes:
--   * Forward-only migration. V1..V5 are already applied in dev/
--     team databases and cannot be edited.
--   * All operations are idempotent (IF NOT EXISTS where supported).
-- ============================================================

-- ---------- B7: cart_items.price snapshot --------------------
ALTER TABLE cart_items
    ADD COLUMN IF NOT EXISTS price NUMERIC(12, 2);

-- ---------- B11: refresh_tokens ------------------------------
CREATE TABLE IF NOT EXISTS refresh_tokens (
    id            UUID        PRIMARY KEY,
    user_id       UUID        NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    token_hash    VARCHAR(128) NOT NULL UNIQUE,
    expires_at    TIMESTAMPTZ NOT NULL,
    revoked       BOOLEAN     NOT NULL DEFAULT FALSE,
    created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_refresh_tokens_user_id
    ON refresh_tokens(user_id);

-- ---------- B13: password_reset_tokens -----------------------
CREATE TABLE IF NOT EXISTS password_reset_tokens (
    id            UUID        PRIMARY KEY,
    user_id       UUID        NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    token_hash    VARCHAR(128) NOT NULL UNIQUE,
    expires_at    TIMESTAMPTZ NOT NULL,
    consumed_at   TIMESTAMPTZ,
    created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_password_reset_user_id
    ON password_reset_tokens(user_id);
