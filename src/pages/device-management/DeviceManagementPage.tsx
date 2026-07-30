import { useCallback, useEffect, useRef, useState } from "react";
import { CircleCheck, Globe, LogOut, Monitor, RefreshCw, Smartphone, Tablet } from "lucide-react";
import MainLayout from "../../layouts/MainLayout";
import Card from "../../components/ui/Card";
import Button from "../../components/ui/Button";
import { deviceService, type DeviceSession } from "../../services/deviceService";
import { useToast } from "../../hooks/useToast";
import { useAuth } from "../../hooks/useAuth";

const POLL_INTERVAL = 30000;

const deviceIcons: Record<string, typeof Monitor> = {
  desktop: Monitor,
  mobile: Smartphone,
  tablet: Tablet,
};

function formatDate(dateStr: string) {
  const d = new Date(dateStr);
  return d.toLocaleDateString("id-ID", {
    day: "numeric",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function DeviceManagementPage() {
  const [devices, setDevices] = useState<DeviceSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [loggingOut, setLoggingOut] = useState<string | null>(null);
  const previousIdsRef = useRef<Set<string>>(new Set());
  const { logout } = useAuth();
  const { showToast } = useToast();

  const fetchDevices = useCallback(async (silent = false) => {
    try {
      const data = await deviceService.listDevices();
      if (!silent) {
        setDevices(data);
      } else {
        const newIds = new Set(data.map((d) => d.id));
        const prevIds = previousIdsRef.current;
        if (prevIds.size > 0) {
          for (const d of data) {
            if (!d.isCurrent && !prevIds.has(d.id)) {
              showToast(`Perangkat baru terdeteksi: ${d.deviceName ?? "Tidak dikenal"}`, "warning");
            }
          }
        }
        previousIdsRef.current = newIds;
        setDevices(data);
      }
    } catch {
      if (!silent) showToast("Gagal memuat daftar perangkat.", "error");
    } finally {
      setLoading(false);
    }
  }, [showToast]);

  useEffect(() => {
    fetchDevices();
    const interval = setInterval(() => fetchDevices(true), POLL_INTERVAL);
    return () => clearInterval(interval);
  }, [fetchDevices]);

  const handleLogoutDevice = async (deviceId: string) => {
    setLoggingOut(deviceId);
    try {
      await deviceService.logoutDevice(deviceId);
      setDevices((prev) => prev.filter((d) => d.id !== deviceId));
      showToast("Perangkat berhasil dilogoutkan.", "success");
    } catch {
      showToast("Gagal logout perangkat.", "error");
    } finally {
      setLoggingOut(null);
    }
  };

  const handleLogoutCurrentDevice = async () => {
    if (!confirm("Anda akan logout dari perangkat ini. Lanjutkan?")) return;
    logout();
  };

  return (
    <MainLayout>
      <div className="mx-auto max-w-3xl space-y-8">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="qpos-brand-type text-2xl font-bold text-gray-900">
              Perangkat Terhubung
            </h1>
            <p className="mt-1.5 text-sm text-gray-500">
              Perangkat yang sedang atau pernah mengakses akun Anda.
            </p>
          </div>
          <Button variant="secondary" onClick={() => fetchDevices()}>
            <RefreshCw className="h-4 w-4" />
            Muat Ulang
          </Button>
        </div>

        {loading ? (
          <Card className="p-6">
            <div className="flex items-center justify-center py-10">
              <div className="h-6 w-6 animate-spin rounded-full border-2 border-blue-600 border-t-transparent" />
            </div>
          </Card>
        ) : devices.length === 0 ? (
          <Card className="p-6">
            <p className="py-10 text-center text-gray-500">Tidak ada perangkat terdaftar.</p>
          </Card>
        ) : (
          <div className="space-y-4">
            {devices.map((device) => {
              const Icon = deviceIcons[device.deviceType ?? "desktop"] ?? Monitor;

              return (
                <Card
                  key={device.id}
                  className={[
                    "p-6",
                    "border-l-4",
                    device.isCurrent
                      ? "border-l-emerald-600"
                      : "border-l-transparent",
                    "transition-shadow hover:shadow-md",
                  ].join(" ")}
                >
                  <div className="flex items-start gap-5">
                    <div
                      className={[
                        "flex h-11 w-11 shrink-0 items-center justify-center rounded-xl",
                        device.isCurrent ? "bg-emerald-50" : "bg-gray-100",
                      ].join(" ")}
                    >
                      <Icon
                        className={[
                          "h-5 w-5",
                          device.isCurrent ? "text-emerald-700" : "text-gray-500",
                        ].join(" ")}
                      />
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5">
                        <p className="qpos-brand-type truncate text-base font-bold text-gray-900">
                          {device.deviceName ?? "Perangkat Tidak Dikenal"}
                        </p>
                        {device.isCurrent ? (
                          <span className="inline-flex items-center gap-1 rounded-full bg-emerald-600 px-3 py-0.5 text-xs font-semibold text-white">
                            <CircleCheck className="h-3 w-3" />
                            Perangkat Saat Ini
                          </span>
                        ) : null}
                      </div>

                      {device.browser && device.os ? (
                        <p className="mt-0.5 text-sm text-gray-500">
                          {device.browser} &middot; {device.os}
                        </p>
                      ) : null}

                      <hr className="my-3 border-gray-200" />

                      <div className="flex flex-wrap items-center gap-x-6 gap-y-1 text-xs text-gray-400">
                        {device.ipAddress ? (
                          <span className="inline-flex items-center gap-1.5">
                            <Globe className="h-3 w-3 text-gray-400" />
                            {device.ipAddress}
                          </span>
                        ) : null}
                        <span>Terakhir aktif: {formatDate(device.lastActiveAt)}</span>
                        <span>Terdaftar: {formatDate(device.createdAt)}</span>
                      </div>
                    </div>

                    <div className="shrink-0 self-start pt-0.5">
                      {device.isCurrent ? (
                        <Button variant="danger" onClick={handleLogoutCurrentDevice}>
                          <LogOut className="h-4 w-4" />
                          Logout
                        </Button>
                      ) : (
                        <Button
                          variant="secondary"
                          onClick={() => handleLogoutDevice(device.id)}
                          disabled={loggingOut === device.id}
                        >
                          <LogOut className="h-4 w-4" />
                          {loggingOut === device.id ? "..." : "Logout"}
                        </Button>
                      )}
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </MainLayout>
  );
}
