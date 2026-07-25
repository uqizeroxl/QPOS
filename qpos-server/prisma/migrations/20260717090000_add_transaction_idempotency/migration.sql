ALTER TABLE "transactions"
ADD COLUMN "idempotencyKey" VARCHAR(191),
ADD COLUMN "requestHash" VARCHAR(64);

CREATE UNIQUE INDEX "transactions_idempotencyKey_key"
ON "transactions"("idempotencyKey");
