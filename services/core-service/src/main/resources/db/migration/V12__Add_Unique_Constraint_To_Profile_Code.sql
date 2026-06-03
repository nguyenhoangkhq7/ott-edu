-- V13: Add unique constraint to profile code to prevent duplicate student/teacher codes
ALTER TABLE profiles ADD CONSTRAINT uq_profiles_code UNIQUE (code);
