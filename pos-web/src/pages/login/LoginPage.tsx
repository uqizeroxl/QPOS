import {
  Apple,
  Eye,
  EyeOff,
  MessageCircle,
  Search,
  Smartphone,
  X,
} from "lucide-react";
import { useEffect, useState } from "react";
import { Navigate, useLocation, useNavigate } from "react-router-dom";
import Button from "../../components/ui/Button";
import Card from "../../components/ui/Card";
import { Input } from "../../components/ui/Input";
import { ROUTES } from "../../constants/routes";
import { useAuth } from "../../hooks/useAuth";
import { useSettings } from "../../hooks/useSettings";
import { AuthApiError, authService } from "../../services/authService";
import { useTranslation } from "react-i18next";

type LocationState = {
  from?: {
    pathname?: string;
  };
};

type PlaceholderDialog = {
  title: string;
  message: string;
};

function FutureAuthDialog({
  dialog,
  onClose,
}: {
  dialog: PlaceholderDialog | null;
  onClose: () => void;
}) {
  useEffect(() => {
    if (!dialog) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [dialog, onClose]);

  if (!dialog) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900/50 p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="future-auth-dialog-title"
    >
      <Card className="w-full max-w-sm border-0 shadow-xl">
        <div className="flex items-center justify-between border-b border-gray-200 px-5 py-4">
          <h2 id="future-auth-dialog-title" className="font-semibold text-gray-900">
            {dialog.title}
          </h2>
          <Button variant="icon" onClick={onClose} aria-label="Tutup dialog">
            <X className="h-5 w-5" />
          </Button>
        </div>
        <div className="p-5">
          <p className="text-sm leading-6 text-gray-600">{dialog.message}</p>
          <div className="mt-5 flex justify-end border-t border-gray-200 pt-4">
            <Button onClick={onClose}>Mengerti</Button>
          </div>
        </div>
      </Card>
    </div>
  );
}

export default function LoginPage() {
  const { isAuthenticated, login } = useAuth();
  const { settings } = useSettings();
  const { t } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();
  const [username, setUsername] = useState("owner");
  const [password, setPassword] = useState("owner123");
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [placeholderDialog, setPlaceholderDialog] =
    useState<PlaceholderDialog | null>(null);
  const state = location.state as LocationState | null;
  const redirectPath = state?.from?.pathname ?? ROUTES.dashboard;

  if (isAuthenticated) {
    return <Navigate to={ROUTES.dashboard} replace />;
  }

  const handleLogin = async () => {
    setErrorMessage("");
    setIsSubmitting(true);

    try {
      const auth = await authService.login(username, password);

      login(auth);
      navigate(redirectPath, { replace: true });
    } catch (error) {
      setErrorMessage(
        error instanceof AuthApiError
          ? error.message
          : t("common.serverError"),
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const showProviderDialog = (provider: string) => {
    setPlaceholderDialog({
      title: "Segera Hadir",
      message: `Fitur Login dengan ${provider} sedang dalam pengembangan dan akan tersedia pada update QPOS berikutnya.`,
    });
  };

  const showRegisterDialog = () => {
    setPlaceholderDialog({
      title: "Segera Hadir",
      message: "Fitur pendaftaran sedang dikembangkan.",
    });
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-100 p-4">
      <Card className="w-full max-w-md p-5 sm:p-6">
        <p className="text-sm font-medium text-blue-600">
          {settings.storeName}
        </p>
        <h1 className="mt-2 text-2xl font-bold text-gray-900">{t("login.title")}</h1>
        <div className="mt-5 space-y-4">
          <label className="space-y-2">
            <span className="text-sm font-medium text-gray-700">{t("login.username")}</span>
            <Input
              value={username}
              onChange={(event) => setUsername(event.target.value)}
            />
          </label>
          <label className="flex w-fit cursor-pointer items-center gap-2 text-sm text-gray-600">
            <input
              type="checkbox"
              className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            />
            Ingat Saya
          </label>
          <label className="space-y-2">
            <span className="text-sm font-medium text-gray-700">{t("login.password")}</span>
            <span className="relative block">
              <Input
                value={password}
                type={isPasswordVisible ? "text" : "password"}
                onChange={(event) => setPassword(event.target.value)}
                className="pr-11"
              />
              <Button
                variant="unstyled"
                onClick={() =>
                  setIsPasswordVisible(
                    (currentVisibility) => !currentVisibility,
                  )
                }
                className="absolute right-3 top-1/2 inline-flex -translate-y-1/2 text-gray-500 transition hover:text-gray-700"
                aria-label={
                  isPasswordVisible ? t("login.hidePassword") : t("login.showPassword")
                }
              >
                {isPasswordVisible ? (
                  <EyeOff className="h-5 w-5" />
                ) : (
                  <Eye className="h-5 w-5" />
                )}
              </Button>
            </span>
          </label>
          {errorMessage ? (
            <p className="rounded-lg bg-red-50 px-3 py-2 text-sm font-medium text-red-700">
              {errorMessage}
            </p>
          ) : null}
          <Button onClick={handleLogin} className="w-full" disabled={isSubmitting}>
            {isSubmitting ? t("login.processing") : t("login.submit")}
          </Button>

          <div className="flex items-center gap-3 py-1" aria-label="Pilihan login lainnya">
            <span className="h-px flex-1 bg-gray-200" />
            <span className="shrink-0 text-xs font-medium text-gray-500">
              Atau lanjutkan dengan
            </span>
            <span className="h-px flex-1 bg-gray-200" />
          </div>

          <div className="grid grid-cols-2 gap-2">
            <Button variant="secondary" onClick={() => showProviderDialog("Google")}>
              <Search className="h-4 w-4" />
              Google
            </Button>
            <Button variant="secondary" onClick={() => showProviderDialog("Apple")}>
              <Apple className="h-4 w-4" />
              Apple
            </Button>
            <Button variant="secondary" onClick={() => showProviderDialog("WhatsApp")}>
              <MessageCircle className="h-4 w-4" />
              WhatsApp
            </Button>
            <Button variant="secondary" onClick={() => showProviderDialog("Nomor HP")}>
              <Smartphone className="h-4 w-4" />
              Nomor HP
            </Button>
          </div>

          <p className="text-center text-sm text-gray-600">
            Belum punya akun?{" "}
            <Button
              variant="unstyled"
              onClick={showRegisterDialog}
              className="font-semibold text-blue-600 hover:text-blue-700"
            >
              Daftar Sekarang
            </Button>
          </p>
        </div>
      </Card>
      <FutureAuthDialog
        dialog={placeholderDialog}
        onClose={() => setPlaceholderDialog(null)}
      />
    </div>
  );
}
