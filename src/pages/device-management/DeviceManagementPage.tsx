import { useCallback, useEffect, useRef, useState } from "react";
import { Globe, LogOut, Monitor, RefreshCw, Smartphone, Tablet, Trash2 } from "lucide-react";
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
      <div className="mx-auto max-w-2xl space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Perangkat Terhubung</h1>
            <p className="mt-1 text-sm text-gray-500">
              Perangkat yang sedang atau pernah mengakses akun Anda.
            </p>
          </div>
          <Button variant="secondary" onClick={() => fetchDevices()}>
            <RefreshCw className="h-4 w-4" />
            Muat Ulang
          </Button>
        </div>

        {loading ? (
          <Card>
            <div className="flex items-center justify-center py-8">
              <div className="h-6 w-6 animate-spin rounded-full border-2 border-blue-600 border-t-transparent" />
            </div>
          </Card>
        ) : devices.length === 0 ? (
          <Card>
            <p className="py-8 text-center text-gray-500">Tidak ada perangkat terdaftar.</p>
          </Card>
        ) : (
          <div className="space-y-3">
            {devices.map((device) => {
              const Icon = deviceIcons[device.deviceType ?? "desktop"] ?? Monitor;

              return (
                <Card key={device.id}>
                  <div className="flex items-start gap-4">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gray-100">
                      <Icon className="h-5 w-5 text-gray-600" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <p className="font-semibold text-gray-900">
                          {device.deviceName ?? "Perangkat Tidak Dikenal"}
                        </p>
                        {device.isCurrent ? (
                          <span className="rounded-full bg-blue-100 px-2 py-0.5 text-xs font-medium text-blue-700">
                            Perangkat Saat Ini
                          </span>
                        ) : null}
                      </div>
                      {device.browser && device.os ? (
                        <p className="mt-0.5 text-sm text-gray-500">
                          {device.browser} &middot; {device.os}
                        </p>
                      ) : null}
                      <div className="mt-1 flex flex-wrap gap-x-4 gap-y-1 text-xs text-gray-400">
                        {device.ipAddress ? (
                          <span className="inline-flex items-center gap-1">
                            <Globe className="h-3 w-3" />
                            {device.ipAddress}
                          </span>
                        ) : null}
                        <span>Terakhir aktif: {formatDate(device.lastActiveAt)}</span>
                        <span>Terdaftar: {formatDate(device.createdAt)}</span>
                      </div>
                    </div>
                    <div className="shrink-0">
                      {device.isCurrent ? (
                        <Button
                          variant="danger"
                          onClick={handleLogoutCurrentDevice}
                        >
                          <LogOut className="h-4 w-4" />
                          Logout
                        </Button>
                      ) : (
                        <Button
                          variant="secondary"
                          onClick={() => handleLogoutDevice(device.id)}
                          disabled={loggingOut === device.id}
                        >
                          <Trash2 className="h-4 w-4" />
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
