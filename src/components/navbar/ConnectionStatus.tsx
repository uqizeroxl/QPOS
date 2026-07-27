import { useContext } from "react";
import { Wifi, WifiOff, RefreshCw } from "lucide-react";
import { NetworkContext } from "../../contexts/NetworkContext";

export default function ConnectionStatus() {
  const { isOnline, pendingCount } = useContext(NetworkContext);

  if (isOnline && pendingCount === 0) {
    return (
      <div className="group relative inline-flex">
        <div className="inline-flex h-10 w-10 items-center justify-center rounded-lg border border-gray-200 text-gray-600 dark:border-slate-700 dark:text-slate-300">
          <Wifi className="h-5 w-5" />
        </div>
        <div className="pointer-events-none absolute -bottom-1 left-1/ z-10 mb-2 w-max max-w-[200px] -translate-x-1/2 translate-y-full rounded-md bg-gray-900 px-3 py-1.5 text-xs text-white opacity-0 shadow-lg transition-opacity group-hover:opacity-100 dark:bg-slate-700">
          Terhubung
        </div>
      </div>
    );
  }

  if (isOnline && pendingCount > 0) {
    return (
      <div className="group relative inline-flex">
        <div className="inline-flex h-10 w-10 items-center justify-center rounded-lg border border-yellow-300 bg-yellow-50 text-yellow-600 dark:border-yellow-600 dark:bg-yellow-900/20 dark:text-yellow-400">
          <RefreshCw className="h-5 w-5 animate-spin" />
        </div>
        <div className="pointer-events-none absolute -bottom-1 left-1/2 z-10 mb-2 w-max max-w-[220px] -translate-x-1/2 translate-y-full rounded-md bg-gray-900 px-3 py-1.5 text-xs text-white opacity-0 shadow-lg transition-opacity group-hover:opacity-100 dark:bg-slate-700">
          Menyinkronkan... {pendingCount} antrean
        </div>
      </div>
    );
  }

  return (
    <div className="group relative inline-flex">
      <div className="inline-flex h-10 w-10 items-center justify-center rounded-lg border border-red-300 bg-red-50 text-red-600 dark:border-red-600 dark:bg-red-900/20 dark:text-red-400">
        <WifiOff className="h-5 w-5" />
      </div>
      <div className="pointer-events-none absolute -bottom-1 left-1/2 z-10 mb-2 w-max max-w-[220px] -translate-x-1/2 translate-y-full rounded-md bg-gray-900 px-3 py-1.5 text-xs text-white opacity-0 shadow-lg transition-opacity group-hover:opacity-100 dark:bg-slate-700">
        Anda sedang offline
      </div>
    </div>
  );
}
