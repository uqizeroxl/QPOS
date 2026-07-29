import { Download, X } from "lucide-react";
import { useEffect, useState } from "react";

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
};

export default function PwaInstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isDismissed, setIsDismissed] = useState(false);
  const [isInstalling, setIsInstalling] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);

  useEffect(() => {
    if (matchMedia("(display-mode: standalone)").matches || (navigator as { standalone?: boolean }).standalone) {
      setIsStandalone(true);
      return;
    }
  }, []);

  useEffect(() => {
    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };

    window.addEventListener("beforeinstallprompt", handler);
    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) return;
    setIsInstalling(true);
    await deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === "accepted") {
      setDeferredPrompt(null);
      setIsDismissed(true);
    }
    setIsInstalling(false);
  };

  const handleDismiss = () => {
    setIsDismissed(true);
    setDeferredPrompt(null);
  };

  if (isStandalone) return null;
  if (!deferredPrompt) return null;
  if (isDismissed) return null;

  return (
    <div className="rounded-xl border border-blue-200 bg-blue-50 p-4 sm:flex sm:items-center sm:justify-between sm:gap-4">
      <div className="flex items-start gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-blue-100">
          <Download className="h-5 w-5 text-blue-600" />
        </div>
        <div>
          <p className="font-semibold text-gray-900">Pasang Aplikasi QPOS</p>
          <p className="mt-0.5 text-sm text-gray-600">
            Pasang QPOS ke layar utama untuk akses lebih cepat dan menggunakan offline.
          </p>
        </div>
      </div>
      <div className="mt-3 flex shrink-0 items-center gap-2 sm:mt-0">
        <button
          onClick={handleInstall}
          disabled={isInstalling}
          className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:opacity-50"
        >
          <Download className="h-4 w-4" />
          {isInstalling ? "Memasang..." : "Pasang"}
        </button>
        <button
          onClick={handleDismiss}
          className="inline-flex items-center rounded-lg p-2 text-gray-500 transition hover:bg-blue-100 hover:text-gray-700"
          aria-label="Tutup"
        >
          <X className="h-5 w-5" />
        </button>
      </div>
    </div>
  );
}
