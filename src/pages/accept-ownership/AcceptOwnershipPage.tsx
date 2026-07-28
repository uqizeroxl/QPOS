import { CheckCircle, Loader2, LogIn, XCircle } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { FcGoogle } from "react-icons/fc";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useGoogleLogin } from "@react-oauth/google";
import Button from "../../components/ui/Button";
import Card from "../../components/ui/Card";
import { ROUTES } from "../../constants/routes";
import { useAuth } from "../../hooks/useAuth";
import { useToast } from "../../hooks/useToast";
import { AuthApiError, authService } from "../../services/authService";

export default function AcceptOwnershipPage() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token");
  const { isAuthenticated, user, login } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [message, setMessage] = useState("");

  const doAcceptOwnership = useCallback(async () => {
    if (!token) {
      setStatus("error");
      setMessage("Token undangan tidak ditemukan.");
      return;
    }

    setStatus("loading");
    try {
      await authService.acceptOwnership(token);
      setStatus("success");
      setMessage("Kepemilikan toko berhasil diterima! Silakan login ulang.");
    } catch (error) {
      setStatus("error");
      setMessage(
        error instanceof AuthApiError
          ? error.message
          : "Gagal menerima undangan.",
      );
    }
  }, [token]);

  useEffect(() => {
    if (isAuthenticated && token && status === "idle") {
      void doAcceptOwnership();
    }
  }, [isAuthenticated, token, status, doAcceptOwnership]);

  const handleGoogleLogin = useGoogleLogin({
    onSuccess: async (credentialResponse) => {
      if (!credentialResponse.access_token) return;
      try {
        const auth = await authService.loginWithGoogle(credentialResponse.access_token);

        if ("needsRegistration" in auth && auth.needsRegistration) {
          navigate(`/register?redirect=${encodeURIComponent(`/accept-ownership?token=${token}`)}`, {
            state: { registrationToken: auth.registrationToken, user: auth.user },
          });
          return;
        }

        login(auth);
        showToast("Login berhasil");
      } catch (error) {
        setStatus("error");
        setMessage(
          error instanceof AuthApiError
            ? error.message
            : "Login gagal.",
        );
      }
    },
    onError: () => {
      setStatus("error");
      setMessage("Login dengan Google gagal.");
    },
    flow: "implicit",
  });

  const handleRetry = () => {
    setStatus("idle");
    setMessage("");
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-100 p-4">
      <Card className="w-full max-w-md p-5 sm:p-6">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900">
            Undangan Kepemilikan Toko
          </h1>

          {!token ? (
            <div className="mt-6">
              <XCircle className="mx-auto h-12 w-12 text-red-500" />
              <p className="mt-4 text-sm text-gray-600">
                Link undangan tidak valid. Pastikan Anda menggunakan link yang
                benar.
              </p>
            </div>
          ) : status === "loading" ? (
            <div className="mt-6">
              <Loader2 className="mx-auto h-12 w-12 animate-spin text-blue-500" />
              <p className="mt-4 text-sm text-gray-600">
                Memproses undangan...
              </p>
            </div>
          ) : status === "success" ? (
            <div className="mt-6">
              <CheckCircle className="mx-auto h-12 w-12 text-emerald-500" />
              <p className="mt-4 text-sm font-medium text-emerald-700">
                {message}
              </p>
              <Button
                className="mt-6"
                onClick={() => navigate(ROUTES.login)}
              >
                <LogIn className="h-4 w-4" />
                Login Sekarang
              </Button>
            </div>
          ) : status === "error" ? (
            <div className="mt-6">
              <XCircle className="mx-auto h-12 w-12 text-red-500" />
              <p className="mt-4 text-sm text-red-600">{message}</p>
              <div className="mt-6 flex justify-center gap-3">
                <Button variant="secondary" onClick={handleRetry}>
                  Coba Lagi
                </Button>
                <Button onClick={() => navigate(ROUTES.login)}>
                  <LogIn className="h-4 w-4" />
                  Login
                </Button>
              </div>
            </div>
          ) : (
            <div className="mt-6">
              {isAuthenticated ? (
                <div className="space-y-4">
                  <p className="text-sm text-gray-600">
                    Anda login sebagai{" "}
                    <strong>{user?.name || user?.username}</strong>.
                    Klik tombol di bawah untuk menerima undangan kepemilikan
                    toko.
                  </p>
                  <Button
                    onClick={() => void doAcceptOwnership()}
                    className="w-full"
                  >
                    Terima Undangan
                  </Button>
                </div>
              ) : (
                <div className="space-y-4">
                  <p className="text-sm text-gray-600">
                    Login dengan Google menggunakan email yang diundang untuk
                    menerima kepemilikan toko.
                  </p>
                  <Button
                    variant="secondary"
                    onClick={() => handleGoogleLogin()}
                    className="w-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2"
                  >
                    <FcGoogle className="h-5 w-5 shrink-0" />
                    Login dengan Google
                  </Button>
                </div>
              )}
            </div>
          )}
        </div>
      </Card>
    </div>
  );
}
