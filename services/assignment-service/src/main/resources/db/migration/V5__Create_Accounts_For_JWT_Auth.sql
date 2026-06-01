-- V5: Create accounts table in ott_assignment_db for JWT token validation.
--
-- Context (Database-per-Service):
--   The assignment-service validates JWT tokens by looking up the user's account
--   (email, password_hash, role, status) in its own database instead of calling
--   core-service over the network during every request.
--
--   This table is READ-ONLY from the assignment-service's perspective.
--   Account lifecycle (create, update, delete) is owned exclusively by core-service.
--   In a full microservices setup this table would be populated via an event stream
--   (e.g., Kafka AccountCreated events) rather than direct DB access.
--
--   Column set is intentionally minimal — only what is needed for security checks.

CREATE TABLE IF NOT EXISTS accounts (
    id          BIGINT       NOT NULL AUTO_INCREMENT,
    email       VARCHAR(255) NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    status      VARCHAR(50)  NOT NULL DEFAULT 'AVAILABLE',
    role        VARCHAR(50)  NOT NULL,
    is_email_verified BOOLEAN NOT NULL DEFAULT FALSE,
    is_online   BOOLEAN      NOT NULL DEFAULT FALSE,
    PRIMARY KEY (id),
    UNIQUE KEY uk_accounts_email (email)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE INDEX idx_accounts_email ON accounts (email);
