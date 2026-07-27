import { Building2, ChevronDown, Loader2 } from "lucide-react";
import { useState, useRef, useEffect } from "react";
import { useAuth } from "../../hooks/useAuth";
import { useToast } from "../../hooks/useToast";

export default function StoreSwitcher() {
  const { stores, user, switchStore } = useAuth();
  const { showToast } = useToast();
  const [isOpen, setIsOpen] = useState(false);
  const [isSwitching, setIsSwitching] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const currentStore = stores.find((s) => s.id === user?.storeId);
  const displayName = currentStore?.name ?? "Pilih Toko";

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  if (stores.length === 0) return null;

  const handleSwitch = async (storeId: string) => {
    if (storeId === user?.storeId) {
      setIsOpen(false);
      return;
    }

    setIsSwitching(true);
    try {
      const targetStore = stores.find((s) => s.id === storeId);
      await switchStore(storeId);
      showToast(`Berhasil pindah ke toko ${targetStore?.name ?? ""}`);
      window.location.reload();
    } catch {
      // error handled by context
    } finally {
      setIsSwitching(false);
      setIsOpen(false);
    }
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        disabled={isSwitching}
        className="inline-flex items-center gap-2 rounded-lg border border-gray-200 px-3 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
      >
        {isSwitching ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <Building2 className="h-4 w-4 text-gray-500 dark:text-slate-400" />
        )}
        <span className="max-w-[120px] truncate">{displayName}</span>
        {!isSwitching && (
          <ChevronDown className={`h-3 w-3 text-gray-400 transition-transform ${isOpen ? "rotate-180" : ""}`} />
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 z-50 mt-1 w-56 rounded-lg border border-gray-200 bg-white py-1 shadow-lg dark:border-slate-700 dark:bg-slate-800">
          <div className="border-b border-gray-100 px-3 py-2 text-xs font-medium uppercase tracking-wider text-gray-500 dark:border-slate-700 dark:text-slate-400">
            Pilih Toko
          </div>
          {stores.map((store) => (
            <button
              key={store.id}
              type="button"
              onClick={() => handleSwitch(store.id)}
              className={`flex w-full items-center gap-3 px-3 py-2 text-left text-sm transition hover:bg-gray-50 dark:hover:bg-slate-700 ${
                store.id === user?.storeId
                  ? "bg-blue-50 font-semibold text-blue-700 dark:bg-blue-900/30 dark:text-blue-400"
                  : "text-gray-700 dark:text-slate-300"
              }`}
            >
              <Building2 className="h-4 w-4 shrink-0" />
              <span className="flex-1 truncate">{store.name}</span>
              {store.id === user?.storeId && (
                <span className="shrink-0 text-xs text-blue-600 dark:text-blue-400">Aktif</span>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
