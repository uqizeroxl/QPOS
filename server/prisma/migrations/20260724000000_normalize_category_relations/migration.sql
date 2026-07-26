-- Consolidate legacy categories whose names only differ by casing or whitespace.
-- Prefer an already-normalized UPPERCASE row, then the oldest row, as canonical.
WITH ranked_categories AS (
  SELECT
    "id",
    UPPER(BTRIM("name")) AS normalized_name,
    FIRST_VALUE("id") OVER (
      PARTITION BY UPPER(BTRIM("name"))
      ORDER BY
        CASE WHEN "name" = UPPER(BTRIM("name")) THEN 0 ELSE 1 END,
        "createdAt",
        "id"
    ) AS canonical_id
  FROM "categories"
), duplicate_categories AS (
  SELECT "id", canonical_id
  FROM ranked_categories
  WHERE "id" <> canonical_id
)
UPDATE "products" AS product
SET "categoryId" = duplicate.canonical_id
FROM duplicate_categories AS duplicate
WHERE product."categoryId" = duplicate."id";

WITH ranked_categories AS (
  SELECT
    "id",
    FIRST_VALUE("id") OVER (
      PARTITION BY UPPER(BTRIM("name"))
      ORDER BY
        CASE WHEN "name" = UPPER(BTRIM("name")) THEN 0 ELSE 1 END,
        "createdAt",
        "id"
    ) AS canonical_id
  FROM "categories"
)
DELETE FROM "categories"
WHERE "id" IN (
  SELECT "id" FROM ranked_categories WHERE "id" <> canonical_id
);

UPDATE "categories"
SET "name" = UPPER(BTRIM("name"));
