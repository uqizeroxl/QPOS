-- CreateTable
CREATE TABLE "device_sessions" (
    "id" TEXT NOT NULL,
    "accountId" TEXT NOT NULL,
    "deviceName" VARCHAR(200),
    "deviceType" VARCHAR(50),
    "browser" VARCHAR(100),
    "os" VARCHAR(100),
    "ipAddress" VARCHAR(50),
    "tokenVersion" INTEGER NOT NULL DEFAULT 1,
    "lastActiveAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "device_sessions_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "device_sessions_accountId_idx" ON "device_sessions"("accountId");

-- AddForeignKey
ALTER TABLE "device_sessions" ADD CONSTRAINT "device_sessions_accountId_fkey" FOREIGN KEY ("accountId") REFERENCES "accounts"("id") ON DELETE CASCADE ON UPDATE CASCADE;
