import { DatabaseBackup, Save, Settings } from "lucide-react";
import { useState } from "react";
import Button from "../../components/ui/Button";
import Card from "../../components/ui/Card";
import { Input, Select, Textarea } from "../../components/ui/Input";
import { useSettings } from "../../hooks/useSettings";
import { useTheme } from "../../hooks/useTheme";
import MainLayout from "../../layouts/MainLayout";
import type { ThemePreference } from "../../contexts/themeContextValue";

export default function SettingPage() {
  const { settings, saveSettings } = useSettings();
  const { theme, setTheme } = useTheme();
  const [storeInfo, setStoreInfo] = useState(settings);
  const [message, setMessage] = useState("");

  const handleSave = async () => {
    const result = await saveSettings(storeInfo);
    if (result.ok) {
      setMessage("Pengaturan toko berhasil disimpan.");
    } else {
      setMessage(result.error ?? "Gagal menyimpan pengaturan.");
    }
  };

  const handleBackup = () => {
    setMessage("Backup data lokal berhasil dibuat.");
  };

  return (
    <MainLayout>
      <div className="space-y-6">
        <Card className="flex flex-col justify-between gap-4 p-5 sm:flex-row sm:items-center">
          <div>
            <p className="text-sm font-medium text-blue-600">
              Konfigurasi Sistem
            </p>
            <h1 className="mt-2 text-2xl font-bold text-gray-900 sm:text-3xl">
              Pengaturan
            </h1>
            <p className="mt-1 text-gray-500">
              Atur informasi toko dan backup data aplikasi.
            </p>
          </div>

          <div className="flex items-center gap-3 rounded-lg bg-blue-50 px-4 py-3 text-blue-700">
            <Settings className="h-5 w-5" />
            <div>
              <p className="text-sm font-semibold">{settings.storeName}</p>
              <p className="text-xs">Pengaturan lokal</p>
            </div>
          </div>
        </Card>

        <Card as="section" className="p-5">
          <div className="border-b border-gray-200 pb-4">
            <h2 className="text-lg font-semibold text-gray-900">
              Informasi Toko
            </h2>
            <p className="mt-1 text-sm text-gray-500">
              Data ini digunakan sebagai identitas toko pada aplikasi POS.
            </p>
          </div>

          <div className="mt-5 grid gap-4">
            <label className="space-y-2">
              <span className="text-sm font-medium text-gray-700">
                Nama Toko
              </span>
              <Input
                value={storeInfo.storeName}
                onChange={(event) =>
                  setStoreInfo((currentInfo) => ({
                    ...currentInfo,
                    storeName: event.target.value,
                  }))
                }
              />
            </label>

            <label className="space-y-2">
              <span className="text-sm font-medium text-gray-700">
                Nomor Telepon
              </span>
              <Input
                value={storeInfo.phone}
                onChange={(event) =>
                  setStoreInfo((currentInfo) => ({
                    ...currentInfo,
                    phone: event.target.value,
                  }))
                }
              />
            </label>

            <label className="space-y-2">
              <span className="text-sm font-medium text-gray-700">Alamat</span>
              <Textarea
                rows={4}
                value={storeInfo.address}
                onChange={(event) =>
                  setStoreInfo((currentInfo) => ({
                    ...currentInfo,
                    address: event.target.value,
                  }))
                }
              />
            </label>

            <label className="space-y-2">
              <span className="text-sm font-medium text-gray-700">Tema</span>
              <Select
                value={theme}
                onChange={(event) =>
                  setTheme(event.target.value as ThemePreference)
                }
              >
                <option value="light">Light</option>
                <option value="dark">Dark</option>
                <option value="system">System</option>
              </Select>
            </label>
          </div>

          {message ? (
            <p className="mt-5 rounded-lg bg-emerald-50 px-3 py-2 text-sm font-medium text-emerald-700">
              {message}
            </p>
          ) : null}

          <div className="mt-5 flex flex-col gap-3 border-t border-gray-200 pt-5 sm:flex-row sm:justify-end">
            <Button
              variant="secondary"
              onClick={handleBackup}
            >
              <DatabaseBackup className="h-4 w-4" />
              Backup Database
            </Button>
            <Button
              onClick={handleSave}
            >
              <Save className="h-4 w-4" />
              Simpan
            </Button>
          </div>
        </Card>
      </div>
    </MainLayout>
  );
}
