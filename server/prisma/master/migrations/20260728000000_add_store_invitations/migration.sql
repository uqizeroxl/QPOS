-- CreateEnum
CREATE TYPE "InvitationStatus" AS ENUM ('PENDING', 'ACCEPTED', 'EXPIRED');

-- CreateTable
CREATE TABLE "store_invitations" (
    "id" TEXT NOT NULL,
    "storeId" TEXT NOT NULL,
    "email" VARCHAR(255) NOT NULL,
    "token" VARCHAR(255) NOT NULL,
    "status" "InvitationStatus" NOT NULL DEFAULT 'PENDING',
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "store_invitations_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "store_invitations_token_key" ON "store_invitations"("token");

-- CreateIndex
CREATE INDEX "store_invitations_storeId_idx" ON "store_invitations"("storeId");

-- CreateIndex
CREATE INDEX "store_invitations_token_idx" ON "store_invitations"("token");

-- CreateIndex
CREATE INDEX "store_invitations_email_idx" ON "store_invitations"("email");

-- AddForeignKey
ALTER TABLE "store_invitations" ADD CONSTRAINT "store_invitations_storeId_fkey" FOREIGN KEY ("storeId") REFERENCES "stores"("id") ON DELETE CASCADE ON UPDATE CASCADE;
