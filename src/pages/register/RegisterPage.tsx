import { Store } from "lucide-react";
import { useState } from "react";
import { Navigate, useLocation, useNavigate } from "react-router-dom";
import Button from "../../components/ui/Button";
import Card from "../../components/ui/Card";
import { Input } from "../../components/ui/Input";
import { ROUTES } from "../../constants/routes";
import { useAuth } from "../../hooks/useAuth";
import { AuthApiError, authService } from "../../services/authService";

type LocationState = {
  registrationToken?: string;
  user?: { id: string; username: string; name: string };
};

export default function RegisterPage() {
  const { isAuthenticated, login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const state = location.state as LocationState | null;

  const registrationToken = state?.registrationToken ?? "";
  const userName = state?.user?.name ?? "";

  const [storeName, setStoreName] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  if (isAuthenticated) {
    return <Navigate to={ROUTES.dashboard} replace />;
  }

  if (!registrationToken) {
    return <Navigate to={ROUTES.login} replace />;
  }

  const handleSubmit = async () => {
    if (!storeName.trim()) {
      setErrorMessage("Nama toko wajib diisi.");
      return;
    }

    setErrorMessage("");
    setIsSubmitting(true);

    try {
      const auth = await authService.completeRegistration(registrationToken, storeName.trim());
      login(auth);
      navigate(ROUTES.dashboard, { replace: true });
    } catch (error) {
      setErrorMessage(
        error instanceof AuthApiError
          ? error.message
          : "Terjadi kesalahan pada server.",
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-100 p-4">
      <Card className="w-full max-w-md p-5 sm:p-6">
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-blue-100">
            <Store className="h-6 w-6 text-blue-600" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-gray-900">Daftarkan Toko</h1>
            <p className="text-sm text-gray-500">
              Halo, {userName || "Pengguna Baru"}!
            </p>
          </div>
        </div>

        <p className="mt-4 text-sm leading-6 text-gray-600">
          Akun Anda berhasil dibuat. Silakan daftarkan toko pertama Anda untuk mulai menggunakan QPOS.
        </p>

        <div className="mt-5 space-y-4">
          <label className="space-y-2">
            <span className="text-sm font-medium text-gray-700">Nama Toko</span>
            <Input
              value={storeName}
              onChange={(event) => setStoreName(event.target.value)}
              placeholder="Masukkan nama toko"
            />
          </label>

          {errorMessage ? (
            <p className="rounded-lg bg-red-50 px-3 py-2 text-sm font-medium text-red-700">
              {errorMessage}
            </p>
          ) : null}

          <Button onClick={handleSubmit} className="w-full" disabled={isSubmitting}>
            {isSubmitting ? "Memproses..." : "Daftarkan Toko"}
          </Button>
        </div>
      </Card>
    </div>
  );
}
