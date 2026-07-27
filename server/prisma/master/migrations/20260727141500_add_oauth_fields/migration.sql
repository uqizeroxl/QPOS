-- AlterTable: set default passwordHash for new accounts
ALTER TABLE "accounts" ALTER COLUMN "passwordHash" SET DEFAULT '';

-- Add new OAuth columns to accounts table
ALTER TABLE "accounts" 
ADD COLUMN IF NOT EXISTS "email" VARCHAR(255),
ADD COLUMN IF NOT EXISTS "googleId" VARCHAR(255),
ADD COLUMN IF NOT EXISTS "appleId" VARCHAR(255),
ADD COLUMN IF NOT EXISTS "avatarUrl" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "accounts_email_key" ON "accounts"("email");
CREATE UNIQUE INDEX IF NOT EXISTS "accounts_googleId_key" ON "accounts"("googleId");
CREATE UNIQUE INDEX IF NOT EXISTS "accounts_appleId_key" ON "accounts"("appleId");
CREATE INDEX IF NOT EXISTS "accounts_email_idx" ON "accounts"("email");
