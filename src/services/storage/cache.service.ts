import { db } from "./db";

const DEFAULT_TTL = 5 * 60 * 1000;

export const cacheService = {
  async get<T>(url: string): Promise<T | null> {
    try {
      const entry = await db.cache.get(url);
      if (!entry) return null;

      const now = Date.now();
      if (now - entry.cachedAt > entry.ttl) {
        await db.cache.delete(url);
        return null;
      }

      return entry.data as T;
    } catch {
      // IndexedDB may be unavailable (private mode or denied storage).
      return null;
    }
  },

  async set(url: string, data: unknown, ttl = DEFAULT_TTL): Promise<void> {
    try {
      await db.cache.put({
        url,
        data,
        cachedAt: Date.now(),
        ttl,
      });
    } catch {
      // IndexedDB may be unavailable (private mode or denied storage).
    }
  },

  async delete(url: string): Promise<void> {
    try {
      await db.cache.delete(url);
    } catch {
      // IndexedDB may be unavailable (private mode or denied storage).
    }
  },

  async clear(): Promise<void> {
    try {
      await db.cache.clear();
    } catch {
      // IndexedDB may be unavailable (private mode or denied storage).
    }
  },

  async prune(): Promise<number> {
    try {
      const now = Date.now();
      const expired = await db.cache
        .filter((entry) => now - entry.cachedAt > entry.ttl)
        .toArray();

      const ids = expired.map((e) => e.url);
      if (ids.length > 0) {
        await db.cache.bulkDelete(ids);
      }
      return ids.length;
    } catch {
      return 0;
    }
  },
};
