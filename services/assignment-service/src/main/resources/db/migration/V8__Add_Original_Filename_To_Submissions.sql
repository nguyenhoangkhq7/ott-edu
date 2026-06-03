-- V8: Add Original Filename To Submissions
--
-- Adds original_filename column to the submissions table to store the original name of student uploaded files.

ALTER TABLE submissions
ADD COLUMN original_filename VARCHAR(255);
