import { db } from "./db";
import { apiService } from "../api/apiService";

const MAX_RETRIES = 5;

export const syncService = {
  async enqueue(
    url: string,
    method: "POST" | "PUT" | "DELETE",
    body?: unknown,
    headers?: Record<string, string>,
  ): Promise<number> {
    const id = await db.pendingMutations.add({
      url,
      method,
      body,
      headers,
      createdAt: Date.now(),
      retryCount: 0,
      status: "pending",
    });
    return id;
  },

  async getQueueLength(): Promise<number> {
    return db.pendingMutations
      .filter((m) => m.status === "pending")
      .count();
  },

  async processQueue(): Promise<{ succeeded: number; failed: number }> {
    const pending = await db.pendingMutations
      .where("status")
      .equals("pending")
      .sortBy("createdAt");

    let succeeded = 0;
    let failed = 0;

    for (const mutation of pending) {
      if (mutation.retryCount >= MAX_RETRIES) {
        await db.pendingMutations.update(mutation.id!, {
          status: "failed",
          error: "Max retries exceeded",
        });
        failed++;
        continue;
      }

      try {
        const config: Record<string, unknown> = {};
        if (mutation.headers) {
          config.headers = mutation.headers;
        }

        if (mutation.method === "POST") {
          await apiService.post(mutation.url, mutation.body, config);
        } else if (mutation.method === "PUT") {
          await apiService.put(mutation.url, mutation.body, config);
        } else if (mutation.method === "DELETE") {
          await apiService.delete(mutation.url, config);
        }

        await db.pendingMutations.delete(mutation.id!);
        succeeded++;
      } catch {
        await db.pendingMutations.update(mutation.id!, {
          retryCount: mutation.retryCount + 1,
          status: mutation.retryCount + 1 >= MAX_RETRIES ? "failed" : "pending",
          error: mutation.retryCount + 1 >= MAX_RETRIES ? "Max retries exceeded" : undefined,
        });
        failed++;
      }
    }

    return { succeeded, failed };
  },

  async pruneOldEntries(days = 7): Promise<number> {
    const cutoff = Date.now() - days * 24 * 60 * 60 * 1000;
    const old = await db.pendingMutations
      .where("createdAt")
      .below(cutoff)
      .toArray();

    const ids = old.map((m) => m.id!);
    if (ids.length > 0) {
      await db.pendingMutations.bulkDelete(ids);
    }
    return ids.length;
  },

  async clearFailed(): Promise<number> {
    const failed = await db.pendingMutations
      .where("status")
      .equals("failed")
      .toArray();

    const ids = failed.map((m) => m.id!);
    if (ids.length > 0) {
      await db.pendingMutations.bulkDelete(ids);
    }
    return ids.length;
  },
};
