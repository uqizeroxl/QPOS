import { useContext } from "react";
import { NetworkContext } from "../contexts/NetworkContext";

export default function OfflineBanner() {
  const { isOnline, pendingCount } = useContext(NetworkContext);

  if (isOnline && pendingCount === 0) return null;

  return (
    <div
      className={`fixed bottom-0 left-0 right-0 z-50 px-4 py-2 text-center text-sm font-medium shadow-lg ${
        isOnline
          ? "bg-yellow-500 text-white"
          : "bg-red-600 text-white"
      }`}
    >
      {isOnline
        ? `Sinkronisasi data... ${pendingCount} antrean`
        : "Anda sedang offline. Data akan disinkronkan saat koneksi tersedia."}
    </div>
  );
}
