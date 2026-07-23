-- Add product snapshot fields to preserve transaction history after product changes/deletes
ALTER TABLE "transaction_items" ADD COLUMN "categoryName" VARCHAR(120) NOT NULL DEFAULT '';
ALTER TABLE "transaction_items" ADD COLUMN "supplierName" VARCHAR(150);
