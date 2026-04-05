-- Migration to add missing columns according to Class Diagram (Complete Version for Fresh Start)
ALTER TABLE accounts ADD COLUMN is_active BOOLEAN NOT NULL DEFAULT TRUE AFTER is_email_verified;
ALTER TABLE profiles ADD COLUMN is_verified BOOLEAN NOT NULL DEFAULT FALSE AFTER code;
