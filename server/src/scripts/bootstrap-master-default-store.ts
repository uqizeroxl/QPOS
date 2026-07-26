import { PrismaPg } from "@prisma/adapter-pg";
import bcrypt from "bcryptjs";
import dotenv from "dotenv";

import { StoreRole, TenantMigrationStatus } from "../generated/master-prisma/client";
import { PrismaClient, UserRole } from "../generated/prisma/client";
import { appConfig } from "../config/app.config";
import { masterPrisma } from "../utils/master-prisma";

dotenv.config();

const prisma = new PrismaClient({
  adapter: new PrismaPg({
    connectionString: process.env.DATABASE_URL
  })
});

const DEFAULT_STORE_NAME = "Multazam";

const mapStoreRole = (role: UserRole) => {
  if (role === UserRole.OWNER) {
    return StoreRole.OWNER;
  }

  if (role === UserRole.CASHIER) {
    return StoreRole.CASHIER;
  }

  return StoreRole.MANAGER;
};

const getExistingStoreDatabaseUrl = () => {
  if (!process.env.DATABASE_URL) {
    throw new Error("DATABASE_URL is required to register existing store database.");
  }

  return process.env.DATABASE_URL;
};

const findOrCreateDefaultStore = async () => {
  const existingStore = await masterPrisma.store.findFirst({
    where: {
      name: DEFAULT_STORE_NAME
    },
    orderBy: {
      createdAt: "asc"
    }
  });

  if (existingStore) {
    return masterPrisma.store.update({
      where: {
        id: existingStore.id
      },
      data: {
        isActive: true
      }
    });
  }

  return masterPrisma.store.create({
    data: {
      name: DEFAULT_STORE_NAME,
      isActive: true
    }
  });
};

const bootstrap = async () => {
  let users = await prisma.user.findMany({
    orderBy: {
      createdAt: "asc"
    }
  });

  if (!users.length) {
    await prisma.user.create({
      data: {
        username: appConfig.defaultOwnerUsername,
        name: appConfig.defaultOwnerName,
        passwordHash: await bcrypt.hash(appConfig.defaultOwnerPassword, 12),
        role: UserRole.OWNER
      }
    });

    users = await prisma.user.findMany({
      orderBy: {
        createdAt: "asc"
      }
    });
  }
  const store = await findOrCreateDefaultStore();
  const now = new Date();

  await masterPrisma.tenantDatabaseRegistry.upsert({
    where: {
      storeId: store.id
    },
    update: {
      databaseUrl: getExistingStoreDatabaseUrl(),
      schemaVersion: "legacy-qpos",
      migrationStatus: TenantMigrationStatus.SUCCESS,
      lastMigratedAt: now
    },
    create: {
      storeId: store.id,
      databaseUrl: getExistingStoreDatabaseUrl(),
      schemaVersion: "legacy-qpos",
      migrationStatus: TenantMigrationStatus.SUCCESS,
      lastMigratedAt: now
    }
  });

  let migratedAccounts = 0;

  for (const user of users) {
    const account = await masterPrisma.account.upsert({
      where: {
        username: user.username
      },
      update: {
        name: user.name,
        passwordHash: user.passwordHash,
        isActive: user.isActive
      },
      create: {
        username: user.username,
        name: user.name,
        passwordHash: user.passwordHash,
        isActive: user.isActive
      }
    });

    await masterPrisma.storeMember.upsert({
      where: {
        accountId_storeId: {
          accountId: account.id,
          storeId: store.id
        }
      },
      update: {
        role: mapStoreRole(user.role)
      },
      create: {
        accountId: account.id,
        storeId: store.id,
        role: mapStoreRole(user.role)
      }
    });

    migratedAccounts += 1;
  }

  console.log(
    JSON.stringify(
      {
        store: {
          id: store.id,
          name: store.name
        },
        existingUsers: users.length,
        migratedAccounts
      },
      null,
      2
    )
  );
};

bootstrap()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await masterPrisma.$disconnect();
    await prisma.$disconnect();
  });
