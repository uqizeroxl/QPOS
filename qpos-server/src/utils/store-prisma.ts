import { PrismaPg } from "@prisma/adapter-pg";

import { TenantMigrationStatus } from "../generated/master-prisma/client";
import { PrismaClient } from "../generated/prisma/client";
import { masterPrisma } from "./master-prisma";

const STORE_CLIENT_IDLE_TTL_MS = 10 * 60 * 1000;

type CachedStorePrismaClient = {
  client: PrismaClient;
  lastUsedAt: number;
};

const storePrismaClients = new Map<string, CachedStorePrismaClient>();

export class StoreTenantError extends Error {
  constructor(message = "Tenant database is not available.") {
    super(message);
  }
}

export class StoreTenantNotFoundError extends StoreTenantError {
  constructor() {
    super("Store tenant not found.");
  }
}

export class StoreTenantInactiveError extends StoreTenantError {
  constructor() {
    super("Store tenant is inactive.");
  }
}

export class StoreTenantRegistryNotFoundError extends StoreTenantError {
  constructor() {
    super("Store tenant registry not found.");
  }
}

export class StoreTenantMigrationNotReadyError extends StoreTenantError {
  constructor() {
    super("Store tenant migration is not ready.");
  }
}

const cleanupStaleStorePrismaClients = async () => {
  const now = Date.now();
  const staleEntries = [...storePrismaClients.entries()].filter(
    ([, cacheEntry]) => now - cacheEntry.lastUsedAt > STORE_CLIENT_IDLE_TTL_MS
  );

  await Promise.all(
    staleEntries.map(async ([storeId, cacheEntry]) => {
      storePrismaClients.delete(storeId);
      await cacheEntry.client.$disconnect();
    })
  );
};

const getTenantRegistry = async (storeId: string) => {
  const store = await masterPrisma.store.findUnique({
    where: {
      id: storeId
    },
    select: {
      id: true,
      isActive: true,
      tenantRegistry: {
        select: {
          databaseUrl: true,
          migrationStatus: true
        }
      }
    }
  });

  if (!store) {
    throw new StoreTenantNotFoundError();
  }

  if (!store.isActive) {
    throw new StoreTenantInactiveError();
  }

  if (!store.tenantRegistry) {
    throw new StoreTenantRegistryNotFoundError();
  }

  if (store.tenantRegistry.migrationStatus !== TenantMigrationStatus.SUCCESS) {
    throw new StoreTenantMigrationNotReadyError();
  }

  return store.tenantRegistry;
};

export const getStorePrisma = async (storeId: string) => {
  await cleanupStaleStorePrismaClients();

  const cachedClient = storePrismaClients.get(storeId);

  if (cachedClient) {
    cachedClient.lastUsedAt = Date.now();
    return cachedClient.client;
  }

  const tenantRegistry = await getTenantRegistry(storeId);
  const clientCreatedWhileLoadingRegistry = storePrismaClients.get(storeId);

  if (clientCreatedWhileLoadingRegistry) {
    clientCreatedWhileLoadingRegistry.lastUsedAt = Date.now();
    return clientCreatedWhileLoadingRegistry.client;
  }

  const client = new PrismaClient({
    adapter: new PrismaPg({
      connectionString: tenantRegistry.databaseUrl
    })
  });

  storePrismaClients.set(storeId, {
    client,
    lastUsedAt: Date.now()
  });

  return client;
};

export const disconnectAllStorePrismaClients = async () => {
  const clients = [...storePrismaClients.values()].map(
    (cacheEntry) => cacheEntry.client
  );

  storePrismaClients.clear();
  await Promise.all(clients.map((client) => client.$disconnect()));
};

export const getStorePrismaCacheSize = () => storePrismaClients.size;
