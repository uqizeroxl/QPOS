import { AlertTriangle, RefreshCw } from "lucide-react";
import Button from "./Button";

type LoadErrorProps = { message: string; onRetry: () => void | Promise<void>; isRetrying?: boolean };

export default function LoadError({ message, onRetry, isRetrying = false }: LoadErrorProps) {
  return (
    <div role="alert" className="flex flex-col gap-3 rounded-lg border border-red-200 bg-red-50 p-4 text-red-800 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex items-start gap-3">
        <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0" />
        <div><p className="font-semibold">Data gagal dimuat</p><p className="text-sm">{message}</p></div>
      </div>
      <Button variant="secondary" onClick={() => void onRetry()} disabled={isRetrying}>
        <RefreshCw className={isRetrying ? "h-4 w-4 animate-spin" : "h-4 w-4"} /> Muat Ulang
      </Button>
    </div>
  );
}
