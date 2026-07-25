-- AlterTable
ALTER TABLE "suppliers" ADD COLUMN "email" VARCHAR(150);
ALTER TABLE "suppliers" ADD COLUMN "isActive" BOOLEAN NOT NULL DEFAULT true;

-- CreateIndex
CREATE UNIQUE INDEX "suppliers_name_key" ON "suppliers"("name");
