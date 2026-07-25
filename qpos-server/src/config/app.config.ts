import dotenv from "dotenv";

dotenv.config();

export const appConfig = {
  port: Number(process.env.PORT) || 3000,
  nodeEnv: process.env.NODE_ENV || "development",
  jwtSecret: process.env.JWT_SECRET || "qpos-development-secret",
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || "1d",
  masterDatabaseUrl: process.env.MASTER_DATABASE_URL || "",
  defaultOwnerUsername: process.env.DEFAULT_OWNER_USERNAME || "owner",
  defaultOwnerPassword: process.env.DEFAULT_OWNER_PASSWORD || "owner123",
  defaultOwnerName: process.env.DEFAULT_OWNER_NAME || "Owner",
  transactionRetentionDays: Math.max(
    1,
    Number(process.env.TRANSACTION_RETENTION_DAYS) || 14
  )
};
