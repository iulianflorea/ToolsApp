-- ToolTrack Schema Initialization

CREATE TABLE IF NOT EXISTS tenants (
    id               BIGINT       NOT NULL AUTO_INCREMENT,
    name             VARCHAR(255) NOT NULL,
    subscription_plan VARCHAR(20) NOT NULL DEFAULT 'FREE',
    active           BOOLEAN      NOT NULL DEFAULT TRUE,
    created_at       DATETIME     NOT NULL,
    PRIMARY KEY (id)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS users (
    id          BIGINT       NOT NULL AUTO_INCREMENT,
    tenant_id   BIGINT       NOT NULL,
    email       VARCHAR(255) NOT NULL,
    password    VARCHAR(255) NOT NULL,
    full_name   VARCHAR(255) NOT NULL,
    role        VARCHAR(20)  NOT NULL DEFAULT 'WORKER',
    active      BOOLEAN      NOT NULL DEFAULT TRUE,
    created_at  DATETIME     NOT NULL,
    PRIMARY KEY (id),
    UNIQUE KEY uq_users_email (email),
    CONSTRAINT fk_users_tenant FOREIGN KEY (tenant_id) REFERENCES tenants (id)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS locations (
    id        BIGINT       NOT NULL AUTO_INCREMENT,
    tenant_id BIGINT       NOT NULL,
    name      VARCHAR(255) NOT NULL,
    address   VARCHAR(500),
    type      VARCHAR(20)  NOT NULL,
    active    BOOLEAN      NOT NULL DEFAULT TRUE,
    PRIMARY KEY (id),
    CONSTRAINT fk_locations_tenant FOREIGN KEY (tenant_id) REFERENCES tenants (id)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS assets (
    id             BIGINT         NOT NULL AUTO_INCREMENT,
    tenant_id      BIGINT         NOT NULL,
    name           VARCHAR(255)   NOT NULL,
    serial_number  VARCHAR(255),
    category       VARCHAR(100),
    status         VARCHAR(20)    NOT NULL DEFAULT 'AVAILABLE',
    qr_code        VARCHAR(255),
    purchase_date  DATE,
    purchase_price DECIMAL(10, 2),
    notes          TEXT,
    image_url      VARCHAR(500),
    created_at     DATETIME       NOT NULL,
    PRIMARY KEY (id),
    UNIQUE KEY uq_assets_qr_code (qr_code),
    CONSTRAINT fk_assets_tenant FOREIGN KEY (tenant_id) REFERENCES tenants (id)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS asset_transfers (
    id                   BIGINT      NOT NULL AUTO_INCREMENT,
    tenant_id            BIGINT      NOT NULL,
    asset_id             BIGINT      NOT NULL,
    from_location_id     BIGINT,
    to_location_id       BIGINT,
    assigned_to_user_id  BIGINT,
    transfer_date        DATETIME,
    return_date          DATETIME,
    notes                TEXT,
    status               VARCHAR(20) NOT NULL DEFAULT 'ACTIVE',
    PRIMARY KEY (id),
    CONSTRAINT fk_transfers_tenant       FOREIGN KEY (tenant_id)           REFERENCES tenants (id),
    CONSTRAINT fk_transfers_asset        FOREIGN KEY (asset_id)            REFERENCES assets (id),
    CONSTRAINT fk_transfers_from_loc     FOREIGN KEY (from_location_id)    REFERENCES locations (id),
    CONSTRAINT fk_transfers_to_loc       FOREIGN KEY (to_location_id)      REFERENCES locations (id),
    CONSTRAINT fk_transfers_user         FOREIGN KEY (assigned_to_user_id) REFERENCES users (id)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS maintenance_records (
    id               BIGINT         NOT NULL AUTO_INCREMENT,
    tenant_id        BIGINT         NOT NULL,
    asset_id         BIGINT         NOT NULL,
    type             VARCHAR(20)    NOT NULL,
    scheduled_date   DATE,
    completed_date   DATE,
    cost             DECIMAL(10, 2),
    technician_name  VARCHAR(255),
    notes            TEXT,
    status           VARCHAR(20)    NOT NULL DEFAULT 'PENDING',
    PRIMARY KEY (id),
    CONSTRAINT fk_maintenance_tenant FOREIGN KEY (tenant_id) REFERENCES tenants (id),
    CONSTRAINT fk_maintenance_asset  FOREIGN KEY (asset_id)  REFERENCES assets (id)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS alerts (
    id         BIGINT      NOT NULL AUTO_INCREMENT,
    tenant_id  BIGINT      NOT NULL,
    asset_id   BIGINT,
    type       VARCHAR(50),
    message    TEXT        NOT NULL,
    is_read    BOOLEAN     NOT NULL DEFAULT FALSE,
    created_at DATETIME    NOT NULL,
    PRIMARY KEY (id),
    CONSTRAINT fk_alerts_tenant FOREIGN KEY (tenant_id) REFERENCES tenants (id),
    CONSTRAINT fk_alerts_asset  FOREIGN KEY (asset_id)  REFERENCES assets (id)
) ENGINE=InnoDB;
