ALTER TABLE "settings"
ADD COLUMN "thermalPaperProfile" VARCHAR(20) NOT NULL DEFAULT '80x80';

UPDATE "settings"
SET "thermalPaperProfile" = CASE
  WHEN "thermalPaperWidth" = 58 THEN '58x30'
  ELSE '80x80'
END;
