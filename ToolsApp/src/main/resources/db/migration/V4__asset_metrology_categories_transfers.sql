-- Metrology fields on assets
ALTER TABLE assets
    ADD COLUMN metrology_date        DATE,
    ADD COLUMN metrology_expiry_date DATE;

-- Indefinite period on transfers (no expected return)
ALTER TABLE asset_transfers
    ADD COLUMN indefinite_period BOOLEAN NOT NULL DEFAULT FALSE;

-- Categories per tenant (free-text, user-managed)
CREATE TABLE categories (
    id        BIGINT AUTO_INCREMENT PRIMARY KEY,
    tenant_id BIGINT       NOT NULL,
    name      VARCHAR(100) NOT NULL,
    UNIQUE KEY uk_cat_tenant (tenant_id, name)
);
