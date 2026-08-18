-- Backend printer removed; thermal printing now runs in the browser (WebUSB/Web Serial).
-- Rename the stored backend value and update the default.

UPDATE "settings"
SET "printerBackend" = 'WEB_THERMAL'
WHERE "printerBackend" = 'NODE_THERMAL_PRINTER';

ALTER TABLE "settings"
ALTER COLUMN "printerBackend" SET DEFAULT 'WEB_THERMAL';
