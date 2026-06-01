ALTER TABLE profiles
    DROP COLUMN custom_school,
    DROP COLUMN custom_department;

ALTER TABLE refresh_tokens
    ADD COLUMN replaced_at TIMESTAMP NULL AFTER revoked;
