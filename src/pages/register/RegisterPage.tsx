import { Check, CheckCircle2, Loader2, Store, User } from "lucide-react";
import { FcGoogle } from "react-icons/fc";
import { SiTiktok } from "react-icons/si";
import { useEffect, useState } from "react";
import { Navigate, useLocation, useNavigate } from "react-router-dom";
import { useGoogleLogin } from "@react-oauth/google";
import Button from "../../components/ui/Button";
import Card from "../../components/ui/Card";
import { Input } from "../../components/ui/Input";
import { ROUTES } from "../../constants/routes";
import { useAuth } from "../../hooks/useAuth";
import type { AuthPayload } from "../../types/auth";
import { AuthApiError, authService } from "../../services/authService";

const STEPS = [
  { label: "Akun", subtitle: "Hubungkan akun" },
  { label: "Profil", subtitle: "Informasi pribadi" },
  { label: "Toko", subtitle: "Informasi toko" },
  { label: "Selesai", subtitle: "Registrasi selesai" },
] as const;

type LocationState = {
  registrationToken?: string;
  user?: { id: string; username: string; name: string };
};

export default function RegisterPage() {
  const { isAuthenticated, login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const state = location.state as LocationState | null;

  const initialStep = state?.registrationToken ? 1 : 1;
  const [currentStep, setCurrentStep] = useState(initialStep);
  const [registrationToken, setRegistrationToken] = useState(
    state?.registrationToken ?? "",
  );
  const [name, setName] = useState(state?.user?.name ?? "");
  const [storeName, setStoreName] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const [isUsingTikTok, setIsUsingTikTok] = useState(false);

  const isAccountConnected = Boolean(registrationToken);

  const handleTikTokLogin = async () => {
    setErrorMessage("");
    setIsSubmitting(true);
    setIsUsingTikTok(true);
    try {
      const state = crypto.randomUUID();
      sessionStorage.setItem("tiktok_oauth_state", state);

      const clientKey = import.meta.env.VITE_TIKTOK_CLIENT_KEY ?? "";
      if (!clientKey) {
        setErrorMessage("TikTok belum dikonfigurasi.");
        setIsSubmitting(false);
        setIsUsingTikTok(false);
        return;
      }

      const redirectUri = `${window.location.origin}/tiktok-callback.html`;
      const authUrl = `https://www.tiktok.com/v2/auth/authorize/?client_key=${clientKey}&scope=user.info.basic&response_type=code&redirect_uri=${encodeURIComponent(redirectUri)}&state=${state}`;

      const popup = window.open(authUrl, "tiktok-register", "width=600,height=700");

      if (!popup) {
        setErrorMessage("Izinkan popup untuk menghubungkan TikTok.");
        setIsSubmitting(false);
        setIsUsingTikTok(false);
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
        setRegistrationToken(auth.registrationToken);
        setName(auth.user.name);
        setCurrentStep(2);
      } else {
        login(auth as AuthPayload);
        navigate(ROUTES.dashboard, { replace: true });
      }
    } catch (error) {
      setErrorMessage(
        error instanceof AuthApiError
          ? error.message
          : error instanceof Error
            ? error.message
            : "Terjadi kesalahan pada server.",
      );
    } finally {
      setIsSubmitting(false);
      setIsUsingTikTok(false);
    }
  };

  useEffect(() => {
    if (state?.registrationToken) {
      setRegistrationToken(state.registrationToken);
      if (state?.user?.name) {
        setName(state.user.name);
        setCurrentStep(2);
      }
    }
  }, [state]);

  if (isAuthenticated) {
    return <Navigate to={ROUTES.dashboard} replace />;
  }

  const handleGoogleLogin = useGoogleLogin({
    onSuccess: async (credentialResponse) => {
      if (!credentialResponse.access_token) return;
      setErrorMessage("");
      setIsSubmitting(true);
      try {
        const auth = await authService.loginWithGoogle(
          credentialResponse.access_token,
        );
        if ("needsRegistration" in auth && auth.needsRegistration) {
          setRegistrationToken(auth.registrationToken);
          setName(auth.user.name);
          setCurrentStep(2);
        } else {
          login(auth as AuthPayload);
          navigate(ROUTES.dashboard, { replace: true });
        }
      } catch (error) {
        setErrorMessage(
          error instanceof AuthApiError
            ? error.message
            : "Terjadi kesalahan pada server.",
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

  const handleSubmit = async () => {
    if (!storeName.trim()) {
      setErrorMessage("Nama toko wajib diisi.");
      return;
    }

    setErrorMessage("");
    setIsSubmitting(true);

    try {
      const auth = await authService.completeRegistration(
        registrationToken,
        storeName.trim(),
      );
      login(auth);
      setCurrentStep(4);
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

  const renderProgressBar = () => (
    <div className="mb-8">
      <div className="flex items-center justify-between">
        {STEPS.map((step, index) => {
          const stepNumber = index + 1;
          const isCompleted = currentStep > stepNumber;
          const isCurrent = currentStep === stepNumber;
          const isLast = index === STEPS.length - 1;

          return (
            <div key={stepNumber} className="flex items-center">
              <div className="flex flex-col items-center">
                <div
                  className={`flex h-9 w-9 items-center justify-center rounded-full text-sm font-semibold transition-colors ${
                    isCompleted
                      ? "bg-emerald-500 text-white"
                      : isCurrent
                        ? "bg-blue-600 text-white"
                        : "border-2 border-gray-300 bg-white text-gray-400"
                  }`}
                >
                  {isCompleted ? (
                    <Check className="h-4 w-4" />
                  ) : (
                    stepNumber
                  )}
                </div>
                <span
                  className={`mt-1.5 text-[11px] font-medium ${
                    isCurrent ? "text-blue-600" : "text-gray-400"
                  }`}
                >
                  {step.label}
                </span>
              </div>
              {!isLast ? (
                <div
                  className={`mx-2 mb-5 h-0.5 w-10 sm:w-16 ${
                    currentStep > stepNumber
                      ? "bg-emerald-400"
                      : "bg-gray-200"
                  }`}
                />
              ) : null}
            </div>
          );
        })}
      </div>
    </div>
  );

  const renderStep1 = () => (
    <div className="space-y-5">
      <div className="text-center">
        <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-blue-100">
          <User className="h-7 w-7 text-blue-600" />
        </div>
        <h2 className="text-lg font-bold text-gray-900">Hubungkan Akun</h2>
        <p className="mt-1 text-sm text-gray-500">
          Hubungkan akun Google{import.meta.env.VITE_TIKTOK_CLIENT_KEY ? " atau TikTok" : ""} untuk memulai.
        </p>
      </div>

      {isAccountConnected ? (
        <div className="rounded-xl border-2 border-emerald-200 bg-emerald-50 p-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-emerald-100">
              <Check className="h-5 w-5 text-emerald-600" />
            </div>
            <div>
              <p className="font-medium text-emerald-800">Akun terhubung</p>
              <p className="text-sm text-emerald-600">{name || "Pengguna"}</p>
            </div>
          </div>
        </div>
      ) : (
        <div className="space-y-3">
          <Button
            variant="secondary"
            onClick={() => handleGoogleLogin()}
            disabled={isSubmitting}
            className="w-full gap-3 py-3"
          >
            <FcGoogle className="h-5 w-5 shrink-0" />
            {isSubmitting && !isUsingTikTok ? "Menghubungkan..." : "Hubungkan Akun Google"}
          </Button>
          {import.meta.env.VITE_TIKTOK_CLIENT_KEY ? (
            <Button
              variant="secondary"
              onClick={() => void handleTikTokLogin()}
              disabled={isSubmitting}
              className="w-full gap-3 py-3"
            >
              <SiTiktok className="h-5 w-5 shrink-0" />
              {isSubmitting && isUsingTikTok ? "Menghubungkan..." : "Hubungkan Akun TikTok"}
            </Button>
          ) : null}
        </div>
      )}

      {errorMessage ? (
        <p className="rounded-lg bg-red-50 px-3 py-2 text-sm font-medium text-red-700">
          {errorMessage}
        </p>
      ) : null}

      {isAccountConnected ? (
        <Button
          onClick={() => setCurrentStep(2)}
          className="w-full"
        >
          Lanjutkan
        </Button>
      ) : null}
    </div>
  );

  const renderStep2 = () => (
    <div className="space-y-5">
      <div className="text-center">
        <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-blue-100">
          <User className="h-7 w-7 text-blue-600" />
        </div>
        <h2 className="text-lg font-bold text-gray-900">Profil Anda</h2>
        <p className="mt-1 text-sm text-gray-500">
          Konfirmasi nama Anda.
        </p>
      </div>

      <label className="space-y-2">
        <span className="text-sm font-medium text-gray-700">Nama Lengkap</span>
        <Input
          value={name}
          onChange={(event) => setName(event.target.value)}
          placeholder="Masukkan nama Anda"
        />
      </label>

      {errorMessage ? (
        <p className="rounded-lg bg-red-50 px-3 py-2 text-sm font-medium text-red-700">
          {errorMessage}
        </p>
      ) : null}

      <div className="flex gap-3">
        <Button
          variant="secondary"
          onClick={() => setCurrentStep(1)}
          className="flex-1"
        >
          Kembali
        </Button>
        <Button
          onClick={() => {
            if (!name.trim()) {
              setErrorMessage("Nama wajib diisi.");
              return;
            }
            setErrorMessage("");
            setCurrentStep(3);
          }}
          className="flex-1"
        >
          Lanjut
        </Button>
      </div>
    </div>
  );

  const renderStep3 = () => (
    <div className="space-y-5">
      <div className="text-center">
        <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-blue-100">
          <Store className="h-7 w-7 text-blue-600" />
        </div>
        <h2 className="text-lg font-bold text-gray-900">Informasi Toko</h2>
        <p className="mt-1 text-sm text-gray-500">
          Daftarkan toko pertama Anda.
        </p>
      </div>

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

      <div className="flex gap-3">
        <Button
          variant="secondary"
          onClick={() => setCurrentStep(2)}
          className="flex-1"
        >
          Kembali
        </Button>
        <Button
          onClick={handleSubmit}
          className="flex-1"
          disabled={isSubmitting}
        >
          {isSubmitting ? (
            <span className="inline-flex items-center gap-2">
              <Loader2 className="h-4 w-4 animate-spin" />
              Memproses...
            </span>
          ) : (
            "Daftarkan Toko"
          )}
        </Button>
      </div>
    </div>
  );

  const renderStep4 = () => (
    <div className="space-y-5 text-center">
      <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-emerald-100">
        <CheckCircle2 className="h-10 w-10 text-emerald-600" />
      </div>
      <div>
        <h2 className="text-xl font-bold text-gray-900">Selamat!</h2>
        <p className="mt-1 text-sm text-gray-500">
          Toko <span className="font-semibold text-gray-700">{storeName}</span> berhasil dibuat.
        </p>
        <p className="text-sm text-gray-400">
          Mengalihkan ke dashboard...
        </p>
      </div>
    </div>
  );

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-100 p-4">
      <Card className="w-full max-w-md p-6">
        <div className="mb-6 text-center">
          <Store className="mx-auto h-8 w-8 text-blue-600" />
          <h1 className="mt-2 text-xl font-bold text-gray-900">QPOS</h1>
          <p className="text-sm text-gray-500">
            {currentStep === 4
              ? "Pendaftaran Berhasil"
              : `Langkah ${currentStep} dari ${STEPS.length}`}
          </p>
        </div>

        <div className="px-2">
          {currentStep < 4 ? renderProgressBar() : null}

          {currentStep === 1 && renderStep1()}
          {currentStep === 2 && renderStep2()}
          {currentStep === 3 && renderStep3()}
          {currentStep === 4 && renderStep4()}
        </div>
      </Card>
    </div>
  );
}
