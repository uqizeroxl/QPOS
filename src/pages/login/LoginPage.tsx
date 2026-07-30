import {
  Eye,
  EyeOff,
} from "lucide-react";
import { useEffect, useState } from "react";
import { FcGoogle } from "react-icons/fc";
import { SiTiktok } from "react-icons/si";
import { Navigate, useLocation, useNavigate } from "react-router-dom";
import { useGoogleLogin } from "@react-oauth/google";
import Button from "../../components/ui/Button";
import Card from "../../components/ui/Card";
import { Input } from "../../components/ui/Input";
import { ROUTES } from "../../constants/routes";
import { useAuth } from "../../hooks/useAuth";
import { useSettings } from "../../hooks/useSettings";
import { useToast } from "../../hooks/useToast";
import type { AuthPayload } from "../../types/auth";
import { AuthApiError, authService } from "../../services/authService";
import { useTranslation } from "react-i18next";

type LocationState = {
  from?: {
    pathname?: string;
  };
};

export default function LoginPage() {
  const { isAuthenticated, login } = useAuth();
  const { settings } = useSettings();
  const { showToast } = useToast();
  const { t } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();
  const [username, setUsername] = useState("owner");
  const [password, setPassword] = useState("owner123");
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const state = location.state as LocationState | null;
  const redirectPath = state?.from?.pathname ?? ROUTES.dashboard;

  useEffect(() => {
    const message = sessionStorage.getItem("auth_expired_message");
    if (message) {
      sessionStorage.removeItem("auth_expired_message");
      showToast(message, "error");
    }
  }, [showToast]);

  const handleGoogleLogin = useGoogleLogin({
    onSuccess: async (credentialResponse) => {
      if (!credentialResponse.access_token) return;
      setErrorMessage("");
      setIsSubmitting(true);
      try {
        const auth = await authService.loginWithGoogle(credentialResponse.access_token);

        if ("needsRegistration" in auth && auth.needsRegistration) {
          navigate("/register", { state: { registrationToken: auth.registrationToken, user: auth.user } });
          return;
        }

        login(auth as AuthPayload);
        const storeName = (auth as AuthPayload).stores?.[0]?.name;
        showToast(`Selamat datang, ${auth.user.name}${storeName ? `, di ${storeName}` : ""}`);
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
    },
    onError: () => {
      setErrorMessage("Login dengan Google gagal.");
    },
    flow: "implicit",
  });

  if (isAuthenticated) {
    return <Navigate to={ROUTES.dashboard} replace />;
  }

  const handleTikTokLogin = async () => {
    setErrorMessage("");
    setIsSubmitting(true);
    try {
      const state = crypto.randomUUID();
      sessionStorage.setItem("tiktok_oauth_state", state);

      const clientKey = import.meta.env.VITE_TIKTOK_CLIENT_KEY ?? "";
      if (!clientKey) {
        setErrorMessage("TikTok belum dikonfigurasi.");
        setIsSubmitting(false);
        return;
      }

      const redirectUri = `${window.location.origin}/tiktok-callback.html`;
      const authUrl = `https://www.tiktok.com/v2/auth/authorize/?client_key=${clientKey}&scope=user.info.basic&response_type=code&redirect_uri=${encodeURIComponent(redirectUri)}&state=${state}`;

      const popup = window.open(authUrl, "tiktok-login", "width=600,height=700");

      if (!popup) {
        setErrorMessage("Izinkan popup untuk login dengan TikTok.");
        setIsSubmitting(false);
        return;
      }

      const code = await new Promise<string>((resolve, reject) => {
        const handleMessage = (event: MessageEvent) => {
          if (event.origin !== window.location.origin) return;
          if (event.data?.type !== "tiktok_oauth") return;
          window.removeEventListener("message", handleMessage);
          if (event.data.error) {
            reject(new Error(event.data.error));
          } else {
            resolve(event.data.code);
          }
        };
        window.addEventListener("message", handleMessage);

        const checkClosed = setInterval(() => {
          if (popup.closed) {
            clearInterval(checkClosed);
            window.removeEventListener("message", handleMessage);
            reject(new Error("Popup ditutup."));
          }
        }, 500);
      });

      const auth = await authService.loginWithTikTok(code);

      if ("needsRegistration" in auth && auth.needsRegistration) {
        navigate("/register", { state: { registrationToken: auth.registrationToken, user: auth.user } });
        return;
      }

      login(auth as AuthPayload);
      const storeName = (auth as AuthPayload).stores?.[0]?.name;
      showToast(`Selamat datang, ${auth.user.name}${storeName ? `, di ${storeName}` : ""}`);
      navigate(redirectPath, { replace: true });
    } catch (error) {
      setErrorMessage(
        error instanceof AuthApiError
          ? error.message
          : error instanceof Error
            ? error.message
            : t("common.serverError"),
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleLogin = async () => {
    setErrorMessage("");
    setIsSubmitting(true);

    try {
      const auth = await authService.login(username, password);

      login(auth);
      const storeName = auth.stores?.[0]?.name;
      showToast(`Selamat datang, ${auth.user.name}${storeName ? `, di ${storeName}` : ""}`);
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

          <Button
            variant="secondary"
            onClick={() => handleGoogleLogin()}
            disabled={isSubmitting}
            className="w-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2"
          >
            <FcGoogle className="h-5 w-5 shrink-0" aria-hidden="true" />
            Google
          </Button>
          {import.meta.env.VITE_TIKTOK_CLIENT_KEY ? (
            <Button
              variant="secondary"
              onClick={() => void handleTikTokLogin()}
              disabled={isSubmitting}
              className="w-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2"
            >
              <SiTiktok className="h-5 w-5 shrink-0" aria-hidden="true" />
              TikTok
            </Button>
          ) : null}
        </div>
      </Card>
    </div>
  );
}
