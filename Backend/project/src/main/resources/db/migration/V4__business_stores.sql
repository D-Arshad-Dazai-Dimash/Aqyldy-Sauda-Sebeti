-- V4: Add owner_id and bin columns to stores for business registration
ALTER TABLE stores ADD COLUMN IF NOT EXISTS owner_id UUID REFERENCES users(id);
ALTER TABLE stores ADD COLUMN IF NOT EXISTS bin VARCHAR(20);

CREATE INDEX IF NOT EXISTS idx_stores_owner ON stores (owner_id);
