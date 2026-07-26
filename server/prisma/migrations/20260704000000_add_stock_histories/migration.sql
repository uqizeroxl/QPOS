-- CreateEnum
CREATE TYPE "StockAdjustmentType" AS ENUM ('ADD', 'REDUCE', 'SET');

-- CreateTable
CREATE TABLE "stock_histories" (
    "id" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "type" "StockAdjustmentType" NOT NULL,
    "quantity" INTEGER NOT NULL,
    "previousStock" INTEGER NOT NULL,
    "currentStock" INTEGER NOT NULL,
    "note" TEXT NOT NULL DEFAULT '',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "stock_histories_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "stock_histories_productId_idx" ON "stock_histories"("productId");

-- CreateIndex
CREATE INDEX "stock_histories_createdAt_idx" ON "stock_histories"("createdAt");

-- AddForeignKey
ALTER TABLE "stock_histories" ADD CONSTRAINT "stock_histories_productId_fkey" FOREIGN KEY ("productId") REFERENCES "products"("id") ON DELETE CASCADE ON UPDATE CASCADE;
