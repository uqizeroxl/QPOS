import { CheckCircle, Loader2, LogIn, XCircle } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { FcGoogle } from "react-icons/fc";
import { SiTiktok } from "react-icons/si";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useGoogleLogin } from "@react-oauth/google";
import Button from "../../components/ui/Button";
import Card from "../../components/ui/Card";
import { ROUTES } from "../../constants/routes";
import { useAuth } from "../../hooks/useAuth";
import { useToast } from "../../hooks/useToast";
import { AuthApiError, authService } from "../../services/authService";
import type { AuthPayload } from "../../types/auth";

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

  const handleTikTokLogin = useCallback(async () => {
    setStatus("loading");
    try {
      const state = crypto.randomUUID();
      sessionStorage.setItem("tiktok_oauth_state", state);

      const clientKey = import.meta.env.VITE_TIKTOK_CLIENT_KEY ?? "";
      if (!clientKey) {
        setStatus("error");
        setMessage("TikTok belum dikonfigurasi.");
        return;
      }

      const redirectUri = `${window.location.origin}/tiktok-callback.html`;
      const authUrl = `https://www.tiktok.com/v2/auth/authorize/?client_key=${clientKey}&scope=user.info.basic&response_type=code&redirect_uri=${encodeURIComponent(redirectUri)}&state=${state}`;

      const popup = window.open(authUrl, "tiktok-accept", "width=600,height=700");

      if (!popup) {
        setStatus("error");
        setMessage("Izinkan popup untuk login dengan TikTok.");
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
        navigate(`/register?redirect=${encodeURIComponent(`/accept-ownership?token=${token}`)}`, {
          state: { registrationToken: auth.registrationToken, user: auth.user },
        });
        return;
      }

      login(auth as AuthPayload);
      showToast("Login berhasil");
    } catch (error) {
      setStatus("error");
      setMessage(
        error instanceof AuthApiError
          ? error.message
          : error instanceof Error
            ? error.message
            : "Login gagal.",
      );
    }
  }, [token, login, navigate, showToast]);

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

        login(auth as AuthPayload);
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
                  <div className="flex flex-col gap-3">
                  <Button
                    variant="secondary"
                    onClick={() => handleGoogleLogin()}
                    className="w-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2"
                  >
                    <FcGoogle className="h-5 w-5 shrink-0" />
                    Login dengan Google
                  </Button>
                  {import.meta.env.VITE_TIKTOK_CLIENT_KEY ? (
                    <Button
                      variant="secondary"
                      onClick={() => void handleTikTokLogin()}
                      className="w-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2"
                    >
                      <SiTiktok className="h-5 w-5 shrink-0" />
                      Login dengan TikTok
                    </Button>
                  ) : null}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </Card>
    </div>
  );
}
