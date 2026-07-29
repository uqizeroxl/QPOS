import dotenv from "dotenv";

dotenv.config();

export const appConfig = {
  port: Number(process.env.PORT) || 3000,
  nodeEnv: process.env.NODE_ENV || "development",
  jwtSecret: process.env.JWT_SECRET || "qpos-development-secret",
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || "1d",
  corsOrigin: process.env.CORS_ORIGIN || "",
  masterDatabaseUrl: process.env.MASTER_DATABASE_URL || "",
  defaultOwnerUsername: process.env.DEFAULT_OWNER_USERNAME || "owner",
  defaultOwnerPassword: process.env.DEFAULT_OWNER_PASSWORD || "owner123",
  defaultOwnerName: process.env.DEFAULT_OWNER_NAME || "Owner",
  transactionRetentionDays: Math.max(
    1,
    Number(process.env.TRANSACTION_RETENTION_DAYS) || 14
  ),
  appUrl: process.env.APP_URL || process.env.CORS_ORIGIN || "http://localhost:5173",
  invitationExpiryHours: Math.max(1, Number(process.env.INVITATION_EXPIRY_HOURS) || 48),
  googleClientId: process.env.GOOGLE_CLIENT_ID || "",
  appleClientId: process.env.APPLE_CLIENT_ID || "",
  appleTeamId: process.env.APPLE_TEAM_ID || "",
  appleKeyId: process.env.APPLE_KEY_ID || "",
  applePrivateKey: (process.env.APPLE_PRIVATE_KEY || "").replace(/\\n/g, "\n"),
  tiktokClientKey: process.env.TIKTOK_CLIENT_KEY || "",
  tiktokClientSecret: process.env.TIKTOK_CLIENT_SECRET || "",
};
