import { PrismaPg } from "@prisma/adapter-pg";
import dotenv from "dotenv";

import { appConfig } from "../config/app.config";
import { PrismaClient } from "../generated/master-prisma/client";

dotenv.config();

const getMasterDatabaseUrl = () => {
  if (!appConfig.masterDatabaseUrl) {
    throw new Error("MASTER_DATABASE_URL is required to use master database.");
  }

  return appConfig.masterDatabaseUrl;
};

const globalForMasterPrisma = globalThis as unknown as {
  masterPrisma?: PrismaClient;
};

export const masterPrisma =
  globalForMasterPrisma.masterPrisma ??
  new PrismaClient({
    adapter: new PrismaPg({
      connectionString: getMasterDatabaseUrl()
    })
  });

if (process.env.NODE_ENV !== "production") {
  globalForMasterPrisma.masterPrisma = masterPrisma;
}
