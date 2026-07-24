import { TenantMigrationStatus } from "../generated/master-prisma/client";
import { appConfig } from "../config/app.config";
import { cleanupExpiredTransactions } from "../services/transaction.service";
import { masterPrisma } from "../utils/master-prisma";
import { getStorePrisma } from "../utils/store-prisma";

const RETENTION_JOB_INTERVAL_MS = 24 * 60 * 60 * 1000;
let isRunning = false;

export const runTransactionRetention = async () => {
  if (isRunning) return;
  isRunning = true;

  try {
    const stores = await masterPrisma.store.findMany({
      where: {
        isActive: true,
        tenantRegistry: {
          migrationStatus: TenantMigrationStatus.SUCCESS
        }
      },
      select: { id: true }
    });
    const cutoff = new Date(
      Date.now() - appConfig.transactionRetentionDays * 24 * 60 * 60 * 1000
    );

    for (const store of stores) {
      try {
        const prisma = await getStorePrisma(store.id);
        const result = await cleanupExpiredTransactions(prisma, cutoff);

        process.stdout.write(
          `[transaction-retention] store=${store.id} deleted=${result.deletedTransactionCount}\n`
        );
      } catch (error) {
        console.error(
          `[transaction-retention] failed for store=${store.id}:`,
          error
        );
      }
    }
  } finally {
    isRunning = false;
  }
};

export const startTransactionRetentionJob = () => {
  void runTransactionRetention();
  return setInterval(() => {
    void runTransactionRetention();
  }, RETENTION_JOB_INTERVAL_MS);
};
