import { Check, Settings, UserRound } from "lucide-react";
import { useEffect, useState } from "react";
import { FcGoogle } from "react-icons/fc";
import { SiTiktok } from "react-icons/si";
import { useGoogleLogin } from "@react-oauth/google";
import Button from "../../components/ui/Button";
import Card from "../../components/ui/Card";
import { useAuth } from "../../hooks/useAuth";
import { useToast } from "../../hooks/useToast";
import MainLayout from "../../layouts/MainLayout";
import {
  AuthApiError,
  authService,
  type AccountInfo,
} from "../../services/authService";

export default function UserSettingsPage() {
  const { user } = useAuth();
  const { showToast } = useToast();
  const [accountInfo, setAccountInfo] = useState<AccountInfo | null>(null);
  const [isBindingGoogle, setIsBindingGoogle] = useState(false);
  const [isBindingTikTok, setIsBindingTikTok] = useState(false);

  useEffect(() => {
    const fetchAccountInfo = async () => {
      try {
        const info = await authService.getAccount();
        setAccountInfo(info);
      } catch {
        // Silently fail
      }
    };
    void fetchAccountInfo();
  }, []);

  const handleBindTikTok = async () => {
    setIsBindingTikTok(true);
    try {
      const state = crypto.randomUUID();
      sessionStorage.setItem("tiktok_oauth_state", state);

      const clientKey = import.meta.env.VITE_TIKTOK_CLIENT_KEY ?? "";
      if (!clientKey) {
        showToast("TikTok belum dikonfigurasi.", "error");
        setIsBindingTikTok(false);
        return;
      }

      const redirectUri = `${window.location.origin}/tiktok-callback.html`;
      const authUrl = `https://www.tiktok.com/v2/auth/authorize/?client_key=${clientKey}&scope=user.info.basic&response_type=code&redirect_uri=${encodeURIComponent(redirectUri)}&state=${state}`;

      const popup = window.open(authUrl, "tiktok-bind", "width=600,height=700");

      if (!popup) {
        showToast("Izinkan popup untuk menghubungkan TikTok.", "error");
        setIsBindingTikTok(false);
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

      const result = await authService.bindTikTok(code);
      setAccountInfo((prev) =>
        prev ? { ...prev, tiktokId: "bound" } : prev,
      );
      showToast(`Akun TikTok (@${result.name}) berhasil terhubung.`);
    } catch (error) {
      showToast(
        error instanceof AuthApiError
          ? error.message
          : error instanceof Error
            ? error.message
            : "Gagal menghubungkan akun TikTok.",
        "error",
      );
    } finally {
      setIsBindingTikTok(false);
    }
  };

  const handleBindGoogle = useGoogleLogin({
    onSuccess: async (credentialResponse) => {
      if (!credentialResponse.access_token) return;
      setIsBindingGoogle(true);
      try {
        const result = await authService.bindGoogle(credentialResponse.access_token);
        setAccountInfo((prev) =>
          prev ? { ...prev, email: result.email, googleId: "bound" } : prev,
        );
        showToast(`Akun Google (${result.email}) berhasil terhubung.`);
      } catch (error) {
        showToast(
          error instanceof AuthApiError
            ? error.message
            : "Gagal menghubungkan akun Google.",
          "error",
        );
      } finally {
        setIsBindingGoogle(false);
      }
    },
    onError: () => {
      showToast("Gagal menghubungkan akun Google.", "error");
      setIsBindingGoogle(false);
    },
    flow: "implicit",
  });

  return (
    <MainLayout>
      <div className="space-y-6">
        <Card className="flex flex-col justify-between gap-4 p-5 sm:flex-row sm:items-center">
          <div>
            <p className="text-sm font-medium text-blue-600">
              Pengaturan Akun
            </p>
            <h1 className="mt-2 text-2xl font-bold text-gray-900 sm:text-3xl">
              Pengaturan Akun
            </h1>
            <p className="mt-1 text-gray-500">
              Kelola akun dan layanan terhubung.
            </p>
          </div>

          <div className="flex items-center gap-3 rounded-lg bg-blue-50 px-4 py-3 text-blue-700">
            <Settings className="h-5 w-5" />
            <div>
              <p className="text-sm font-semibold">{user?.name}</p>
              <p className="text-xs">Pengaturan akun</p>
            </div>
          </div>
        </Card>

        <Card as="section" className="p-5">
          <div className="border-b border-gray-200 pb-4">
            <h2 className="text-lg font-semibold text-gray-900">
              Informasi Akun
            </h2>
            <p className="mt-1 text-sm text-gray-500">
              Informasi dasar akun Anda.
            </p>
          </div>

          <div className="mt-5 grid gap-4">
            <div className="flex items-center gap-3 rounded-lg border border-gray-200 p-4">
              <UserRound className="h-5 w-5 text-gray-400" />
              <div>
                <p className="text-sm font-medium text-gray-900">
                  {user?.name}
                </p>
                <p className="text-xs text-gray-500">@{user?.username}</p>
              </div>
            </div>
          </div>
        </Card>

        <Card as="section" className="p-5">
          <div className="border-b border-gray-200 pb-4">
            <h2 className="text-lg font-semibold text-gray-900">
              Akun Terhubung
            </h2>
            <p className="mt-1 text-sm text-gray-500">
              Hubungkan akun Google untuk memudahkan login dan menerima
              undangan kepemilikan toko.
            </p>
          </div>

          <div className="mt-5 space-y-4">
            <div className="flex items-center justify-between rounded-lg border border-gray-200 p-4">
              <div className="flex items-center gap-3">
                <FcGoogle className="h-6 w-6" />
                <div>
                  <p className="text-sm font-medium text-gray-900">Google</p>
                  <p className="text-xs text-gray-500">
                    {accountInfo?.googleId
                      ? accountInfo.email ?? "Terhubung"
                      : "Belum terhubung"}
                  </p>
                </div>
              </div>
              {accountInfo?.googleId ? (
                <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-3 py-1 text-xs font-medium text-emerald-700">
                  <Check className="h-3 w-3" />
                  Terhubung
                </span>
              ) : (
                <Button
                  variant="secondary"
                  onClick={() => handleBindGoogle()}
                  disabled={isBindingGoogle}
                  className="shrink-0"
                >
                  <FcGoogle className="h-4 w-4" />
                  {isBindingGoogle ? "Menghubungkan..." : "Hubungkan"}
                </Button>
              )}
            </div>
            {import.meta.env.VITE_TIKTOK_CLIENT_KEY ? (
              <div className="flex items-center justify-between rounded-lg border border-gray-200 p-4">
                <div className="flex items-center gap-3">
                  <SiTiktok className="h-6 w-6" />
                  <div>
                    <p className="text-sm font-medium text-gray-900">TikTok</p>
                    <p className="text-xs text-gray-500">
                      {accountInfo?.tiktokId
                        ? "Terhubung"
                        : "Belum terhubung"}
                    </p>
                  </div>
                </div>
                {accountInfo?.tiktokId ? (
                  <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-3 py-1 text-xs font-medium text-emerald-700">
                    <Check className="h-3 w-3" />
                    Terhubung
                  </span>
                ) : (
                  <Button
                    variant="secondary"
                    onClick={() => void handleBindTikTok()}
                    disabled={isBindingTikTok}
                    className="shrink-0"
                  >
                    <SiTiktok className="h-4 w-4" />
                    {isBindingTikTok ? "Menghubungkan..." : "Hubungkan"}
                  </Button>
                )}
              </div>
            ) : null}
          </div>
        </Card>
      </div>
    </MainLayout>
  );
}
