import { AlertTriangle } from "lucide-react";
import Button from "../../components/ui/Button";
import Card from "../../components/ui/Card";

type ErrorPageProps = {
  onRetry?: () => void;
};

export default function ErrorPage({ onRetry }: ErrorPageProps) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-100 p-4">
      <Card className="w-full max-w-md p-6 text-center">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-lg bg-red-50 text-red-700">
          <AlertTriangle className="h-6 w-6" />
        </div>
        <h1 className="mt-4 text-xl font-bold text-gray-900">
          Terjadi Kesalahan
        </h1>
        <p className="mt-2 text-sm text-gray-500">
          Aplikasi mengalami kendala. Silakan muat ulang halaman.
        </p>
        {onRetry ? (
          <Button onClick={onRetry} className="mt-5 w-full">
            Muat Ulang
          </Button>
        ) : null}
      </Card>
    </div>
  );
}
