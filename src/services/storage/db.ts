import Dexie, { type Table } from "dexie";

export type CacheEntry = {
  url: string;
  data: unknown;
  cachedAt: number;
  ttl: number;
};

export type PendingMutation = {
  id?: number;
  url: string;
  method: "POST" | "PUT" | "DELETE";
  body?: unknown;
  headers?: Record<string, string>;
  createdAt: number;
  retryCount: number;
  status: "pending" | "failed";
  error?: string;
};

export class QPOSDB extends Dexie {
  cache!: Table<CacheEntry, string>;
  pendingMutations!: Table<PendingMutation, number>;

  constructor() {
    super("QPOSOffline");
    this.version(1).stores({
      cache: "url, cachedAt",
      pendingMutations: "++id, createdAt, status",
    });
  }
}

export const db = new QPOSDB();
