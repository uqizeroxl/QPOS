import { useCallback, useMemo, useState } from "react";
import type { ReactNode } from "react";
import { ToastContext } from "./toastContextValue";
import type { Toast, ToastType } from "./toastContextValue";

type ToastProviderProps = {
  children: ReactNode;
};

export function ToastProvider({ children }: ToastProviderProps) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const showToast = useCallback((message: string, type: ToastType = "success") => {
    const toast = {
      id: crypto.randomUUID(),
      message,
      type,
    };

    setToasts((currentToasts) => [toast, ...currentToasts].slice(0, 3));
    window.setTimeout(() => {
      setToasts((currentToasts) =>
        currentToasts.filter((currentToast) => currentToast.id !== toast.id),
      );
    }, 3000);
  }, []);

  const value = useMemo(() => ({ showToast }), [showToast]);

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div className="fixed right-4 top-4 z-[60] space-y-3">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className={`rounded-lg px-4 py-3 text-sm font-semibold text-white shadow-lg ${
              toast.type === "success"
                ? "bg-emerald-600"
                : toast.type === "info"
                  ? "bg-blue-600"
                  : "bg-red-600"
            }`}
          >
            {toast.message}
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}
