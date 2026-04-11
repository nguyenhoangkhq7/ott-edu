-- =============================================================
-- Helper Script: Clean up failed Flyway migration V7
-- SmileEdu – assignment-service
-- =============================================================
-- Execute this script to clean up the failed V7 migration
-- Then restart the application
-- Delete the failed V7 migration from Flyway history
DELETE FROM flyway_schema_history
WHERE version = 7
    AND success = FALSE;
-- Verify cleanup
SELECT version,
    description,
    success,
    installed_on
FROM flyway_schema_history
WHERE version >= 6
ORDER BY version DESC;