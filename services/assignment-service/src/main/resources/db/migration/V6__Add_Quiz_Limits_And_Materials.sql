-- V6: Add Quiz Limits, Essay Materials, and Submission File Url
--
-- Adds max_attempts and time_limit columns to the assignments table.
-- Adds file_url column to the submissions table.
-- Creates assignment_materials table to support S3 file links for essays.

ALTER TABLE assignments
ADD COLUMN max_attempts INT NULL,
ADD COLUMN time_limit INT NULL;

ALTER TABLE submissions
ADD COLUMN file_url VARCHAR(2048) NULL;

CREATE TABLE IF NOT EXISTS assignment_materials (
    assignment_id BIGINT NOT NULL,
    material_url TEXT NOT NULL,
    FOREIGN KEY (assignment_id) REFERENCES assignments(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE INDEX idx_assignment_materials_assignment_id ON assignment_materials(assignment_id);
