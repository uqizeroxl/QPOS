import { Eye, EyeOff } from "lucide-react";
import { useState } from "react";
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

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-100 p-4">
      <Card className="w-full max-w-sm p-6">
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
        </div>
      </Card>
    </div>
  );
}
