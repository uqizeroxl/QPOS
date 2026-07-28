import { Building2, Check } from "lucide-react";
import { useEffect, useState } from "react";
import Button from "../../components/ui/Button";
import Card from "../../components/ui/Card";
import { useAuth } from "../../hooks/useAuth";
import { useToast } from "../../hooks/useToast";
import MainLayout from "../../layouts/MainLayout";
import type { StoreInfo } from "../../types/auth";
import { AuthApiError, authService } from "../../services/authService";

export default function StoreManagementPage() {
  const { stores, switchStore, user } = useAuth();
  const activeStoreId = user?.storeId;
  const { showToast } = useToast();
  const [storeList, setStoreList] = useState<StoreInfo[]>([]);
  const [isSwitching, setIsSwitching] = useState<string | null>(null);

  useEffect(() => {
    const fetchStores = async () => {
      try {
        const result = await authService.listStores();
        setStoreList(result);
      } catch {
        if (stores.length > 0) {
          setStoreList(stores);
        }
      }
    };
    void fetchStores();
  }, [stores]);

  const handleSwitch = async (targetStoreId: string) => {
    setIsSwitching(targetStoreId);
    try {
      await switchStore(targetStoreId);
      showToast("Berhasil pindah toko.");
    } catch (error) {
      showToast(
        error instanceof AuthApiError
          ? error.message
          : "Gagal pindah toko.",
        "error",
      );
    } finally {
      setIsSwitching(null);
    }
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return "-";
    try {
      return new Date(dateString).toLocaleDateString("id-ID", {
        year: "numeric",
        month: "long",
        day: "numeric",
      });
    } catch {
      return dateString;
    }
  };

  return (
    <MainLayout>
      <div className="space-y-6">
        <Card className="flex flex-col justify-between gap-4 p-5 sm:flex-row sm:items-center">
          <div>
            <p className="text-sm font-medium text-blue-600">Manajemen Toko</p>
            <h1 className="mt-2 text-2xl font-bold text-gray-900 sm:text-3xl">
              Toko Saya
            </h1>
            <p className="mt-1 text-gray-500">
              Daftar toko yang terdaftar atas akun Anda.
            </p>
          </div>
          <div className="flex items-center gap-3 rounded-lg bg-blue-50 px-4 py-3 text-blue-700">
            <Building2 className="h-5 w-5" />
            <div>
              <p className="text-sm font-semibold">{user?.name}</p>
              <p className="text-xs">Manajemen toko</p>
            </div>
          </div>
        </Card>

        <Card as="section" className="p-5">
          <div className="border-b border-gray-200 pb-4">
            <h2 className="text-lg font-semibold text-gray-900">
              Daftar Toko
            </h2>
            <p className="mt-1 text-sm text-gray-500">
              Pilih toko yang ingin Anda kelola.
            </p>
          </div>

          <div className="mt-5 overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-gray-200 text-xs font-semibold uppercase tracking-wide text-gray-500">
                  <th className="pb-3 pr-4">Nama Toko</th>
                  <th className="pb-3 pr-4">Peran</th>
                  <th className="pb-3 pr-4">Tanggal Bergabung</th>
                  <th className="pb-3 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {storeList.map((store) => (
                  <tr key={store.id} className="hover:bg-gray-50">
                    <td className="py-3 pr-4 font-medium text-gray-900">
                      <div className="flex items-center gap-2">
                        <Building2 className="h-4 w-4 text-gray-400" />
                        {store.name}
                      </div>
                    </td>
                    <td className="py-3 pr-4 text-gray-600">{store.role}</td>
                    <td className="py-3 pr-4 text-gray-600">
                      {formatDate(store.registeredAt)}
                    </td>
                    <td className="py-3 text-right">
                      {store.id === activeStoreId ? (
                        <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-3 py-1.5 text-xs font-medium text-emerald-700">
                          <Check className="h-3 w-3" />
                          Terpilih Saat Ini
                        </span>
                      ) : (
                        <Button
                          variant="secondary"
                          onClick={() => void handleSwitch(store.id)}
                          disabled={isSwitching === store.id}
                        >
                          {isSwitching === store.id
                            ? "Mengalihkan..."
                            : "Pilih"}
                        </Button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {storeList.length === 0 ? (
              <p className="py-8 text-center text-sm text-gray-500">
                Tidak ada toko yang terdaftar.
              </p>
            ) : null}
          </div>
        </Card>
      </div>
    </MainLayout>
  );
}
