ALTER TABLE accounts
    ADD COLUMN role VARCHAR(32) NULL AFTER password_hash,
    ADD COLUMN status VARCHAR(32) NOT NULL DEFAULT 'AVAILABLE' AFTER role,
    ADD COLUMN is_online BOOLEAN NOT NULL DEFAULT FALSE AFTER is_email_verified;

UPDATE accounts a
LEFT JOIN account_roles ar ON ar.account_id = a.id
LEFT JOIN roles r ON r.id = ar.role_id
SET a.role = CASE
    WHEN r.name = 'ROLE_ADMIN' THEN 'ROLE_ADMIN'
    WHEN r.name = 'ROLE_INSTRUCTOR' THEN 'ROLE_TEACHER'
    WHEN r.name = 'ROLE_TEACHER' THEN 'ROLE_TEACHER'
    ELSE 'ROLE_STUDENT'
END;

UPDATE accounts
SET role = 'ROLE_STUDENT'
WHERE role IS NULL;

UPDATE accounts
SET status = 'APPEAR_OFFLINE'
WHERE is_active = FALSE;

ALTER TABLE accounts
    MODIFY COLUMN role VARCHAR(32) NOT NULL;

ALTER TABLE account_roles DROP FOREIGN KEY fk_ar_account;
ALTER TABLE account_roles DROP FOREIGN KEY fk_ar_role;

DROP TABLE IF EXISTS account_roles;
DROP TABLE IF EXISTS roles;

ALTER TABLE accounts DROP COLUMN is_active;
