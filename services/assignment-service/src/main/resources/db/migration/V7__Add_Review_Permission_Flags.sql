-- V7: Add Review Permission Flags
--
-- Adds show_score_after_submit and show_answers_after_submit columns to the assignments table.

ALTER TABLE assignments
ADD COLUMN show_score_after_submit BOOLEAN NOT NULL DEFAULT TRUE,
ADD COLUMN show_answers_after_submit BOOLEAN NOT NULL DEFAULT FALSE;
