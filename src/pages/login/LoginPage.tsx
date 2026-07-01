import { Eye, EyeOff } from "lucide-react";
import { useState } from "react";
import { Navigate, useLocation, useNavigate } from "react-router-dom";
import Button from "../../components/ui/Button";
import Card from "../../components/ui/Card";
import { Input } from "../../components/ui/Input";
import { ROUTES } from "../../constants/routes";
import { useActivityLog } from "../../hooks/useActivityLog";
import { useAuth } from "../../hooks/useAuth";
import { useSettings } from "../../hooks/useSettings";

type LocationState = {
  from?: {
    pathname?: string;
  };
};

export default function LoginPage() {
  const { isAuthenticated, login } = useAuth();
  const { addActivity } = useActivityLog();
  const { settings } = useSettings();
  const navigate = useNavigate();
  const location = useLocation();
  const [username, setUsername] = useState("manager");
  const [password, setPassword] = useState("demo");
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);
  const state = location.state as LocationState | null;
  const redirectPath = state?.from?.pathname ?? ROUTES.dashboard;

  if (isAuthenticated) {
    return <Navigate to={ROUTES.dashboard} replace />;
  }

  const handleDemoLogin = () => {
    login({
      token: "demo-pos-token",
      user: {
        id: "user-1",
        name: "Manager",
        role: "manager",
      },
    });

    addActivity({
      type: "login",
      title: "Login berhasil",
      description: "Mode demo lokal aktif.",
    });

    navigate(redirectPath, { replace: true });
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-100 p-4">
      <Card className="w-full max-w-sm p-6">
        <p className="text-sm font-medium text-blue-600">
          {settings.storeName}
        </p>
        <h1 className="mt-2 text-2xl font-bold text-gray-900">Login Page</h1>
        <div className="mt-5 space-y-4">
          <label className="space-y-2">
            <span className="text-sm font-medium text-gray-700">Username</span>
            <Input
              value={username}
              onChange={(event) => setUsername(event.target.value)}
            />
          </label>
          <label className="space-y-2">
            <span className="text-sm font-medium text-gray-700">Password</span>
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
                  isPasswordVisible ? "Sembunyikan password" : "Tampilkan password"
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
          <Button onClick={handleDemoLogin} className="w-full">
            Masuk Demo
          </Button>
        </div>
      </Card>
    </div>
  );
}
