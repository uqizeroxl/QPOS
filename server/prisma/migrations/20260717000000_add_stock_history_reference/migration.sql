CREATE TYPE "StockReferenceType" AS ENUM ('SALE', 'RESTOCK', 'ADJUSTMENT', 'PURCHASE_ORDER');

ALTER TABLE "stock_histories"
  ADD COLUMN "referenceType" "StockReferenceType",
  ADD COLUMN "referenceId" VARCHAR(191),
  ADD COLUMN "userName" VARCHAR(120);

CREATE INDEX "stock_histories_referenceType_idx" ON "stock_histories"("referenceType");
CREATE INDEX "stock_histories_referenceId_idx" ON "stock_histories"("referenceId");
