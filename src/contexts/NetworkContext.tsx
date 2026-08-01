import { createContext, useCallback, useEffect, useState } from "react";
import type { ReactNode } from "react";
import { networkService } from "../services/storage/network.service";
import { syncService } from "../services/storage/sync.service";
import { cacheService } from "../services/storage/cache.service";

async function requestPersistentStorage() {
  try {
    if (navigator.storage && navigator.storage.persist) {
      await navigator.storage.persist();
    }
  } catch {
    // Persistence is optional and may be denied by the browser.
  }
}

type NetworkContextValue = {
  isOnline: boolean;
  pendingCount: number;
};

// eslint-disable-next-line react-refresh/only-export-components
export const NetworkContext = createContext<NetworkContextValue>({
  isOnline: true,
  pendingCount: 0,
});

type NetworkProviderProps = {
  children: ReactNode;
};

export function NetworkProvider({ children }: NetworkProviderProps) {
  const [isOnline, setIsOnline] = useState(networkService.isOnline);
  const [pendingCount, setPendingCount] = useState(0);

  const refreshPending = useCallback(async () => {
    const count = await syncService.getQueueLength();
    setPendingCount(count);
  }, []);

  useEffect(() => {
    void requestPersistentStorage();

    const pruneInterval = setInterval(async () => {
      await cacheService.prune();
      await syncService.pruneOldEntries(7);
    }, 30 * 60 * 1000);

    const unsubscribe = networkService.subscribe(async (online) => {
      setIsOnline(online);
      if (online) {
        const result = await syncService.processQueue();
        if (result.succeeded > 0) {
          window.dispatchEvent(
            new CustomEvent("app:toast", {
              detail: {
                message: `Sinkronisasi selesai untuk ${result.succeeded} perubahan.`,
                type: "success",
              },
            }),
          );
        }
      }
      await refreshPending();
    });

    return () => {
      unsubscribe();
      clearInterval(pruneInterval);
    };
  }, [refreshPending]);

  useEffect(() => {
    const interval = setInterval(async () => {
      if (networkService.isOnline()) {
        const result = await syncService.processQueue();
        if (result.succeeded > 0) {
          window.dispatchEvent(
            new CustomEvent("app:toast", {
              detail: {
                message: `Sinkronisasi selesai untuk ${result.succeeded} perubahan.`,
                type: "success",
              },
            }),
          );
        }
      }
      await refreshPending();
    }, 60_000);

    return () => clearInterval(interval);
  }, [refreshPending]);

  return (
    <NetworkContext.Provider value={{ isOnline, pendingCount }}>
      {children}
    </NetworkContext.Provider>
  );
}
