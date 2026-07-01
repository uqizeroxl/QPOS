import { Link } from "react-router-dom";
import { SearchX } from "lucide-react";
import Card from "../../components/ui/Card";
import { ROUTES } from "../../constants/routes";

export default function NotFoundPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-100 p-4">
      <Card className="w-full max-w-md p-6 text-center">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-lg bg-blue-50 text-blue-700">
          <SearchX className="h-6 w-6" />
        </div>
        <h1 className="mt-4 text-xl font-bold text-gray-900">
          Halaman Tidak Ditemukan
        </h1>
        <p className="mt-2 text-sm text-gray-500">
          Rute yang kamu buka tidak tersedia di aplikasi POS.
        </p>
        <Link
          to={ROUTES.dashboard}
          className="mt-5 inline-flex h-11 w-full items-center justify-center rounded-lg bg-blue-600 px-4 text-sm font-semibold text-white hover:bg-blue-700"
        >
          Kembali ke Dashboard
        </Link>
      </Card>
    </div>
  );
}
