import {
  AlertTriangle,
  DatabaseBackup,
  FileSpreadsheet,
  Save,
  Settings,
  Trash2,
  Upload,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";
import type { ChangeEvent } from "react";
import Button from "../../components/ui/Button";
import Card from "../../components/ui/Card";
import { Input, Select, Textarea } from "../../components/ui/Input";
import { useProducts } from "../../hooks/useProducts";
import { useAuth } from "../../hooks/useAuth";
import { useCategories } from "../../hooks/useCategories";
import { useSettings } from "../../hooks/useSettings";
import { useSuppliers } from "../../hooks/useSuppliers";
import { useTheme } from "../../hooks/useTheme";
import { useToast } from "../../hooks/useToast";
import MainLayout from "../../layouts/MainLayout";
import type { ThemePreference } from "../../contexts/themeContextValue";
import {
  ProductApiError,
  productService,
  type ProductDatasetImportResult,
  type ProductDatasetPreview,
} from "../../services/productService";
import {
  SettingsApiError,
  settingsService,
  type ProductDatasetResetResult,
} from "../../services/settingsService";

const resetConfirmationText = "HAPUS SEMUA";

export default function SettingPage() {
  const { settings, saveSettings, setReceiptFooter } = useSettings();
  const { user } = useAuth();
  const { theme, setTheme } = useTheme();
  const { fetchProducts } = useProducts();
  const { fetchCategories } = useCategories();
  const { fetchSuppliers } = useSuppliers();
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [storeInfo, setStoreInfo] = useState(settings);
  const { showToast } = useToast();
  const [datasetFile, setDatasetFile] = useState<File | null>(null);
  const [datasetPreview, setDatasetPreview] =
    useState<ProductDatasetPreview | null>(null);
  const [importResult, setImportResult] =
    useState<ProductDatasetImportResult | null>(null);
  const [datasetError, setDatasetError] = useState("");
  const [isDatasetLoading, setIsDatasetLoading] = useState(false);
  const [isResetDialogOpen, setIsResetDialogOpen] = useState(false);
  const [resetConfirmation, setResetConfirmation] = useState("");
  const [resetResult, setResetResult] =
    useState<ProductDatasetResetResult | null>(null);
  const [resetError, setResetError] = useState("");
  const [isResetting, setIsResetting] = useState(false);
  const [receiptFooter, setReceiptFooterInput] = useState(
    settings.receiptFooter,
  );
  const [isSavingReceiptFooter, setIsSavingReceiptFooter] = useState(false);

  useEffect(() => {
    setReceiptFooterInput(settings.receiptFooter);
  }, [settings.receiptFooter]);

  const handleSave = () => {
    saveSettings(storeInfo);
    showToast("Pengaturan toko berhasil disimpan.");
  };

  const handleBackup = () => {
    showToast("Backup data lokal berhasil dibuat.");
  };

  const handleSaveReceiptFooter = async () => {
    setIsSavingReceiptFooter(true);

    try {
      const result = await settingsService.updateReceiptFooter(receiptFooter);
      setReceiptFooterInput(result.receiptFooter);
      setReceiptFooter(result.receiptFooter);
      showToast("Footer struk berhasil disimpan.");
    } catch (error) {
      showToast(
        error instanceof SettingsApiError
          ? error.message
          : "Footer struk gagal disimpan.",
        "error"
      );
    } finally {
      setIsSavingReceiptFooter(false);
    }
  };

  const handleExportDataset = async () => {
    setDatasetError("");
    setIsDatasetLoading(true);

    try {
      await productService.exportDataset();
      showToast("Dataset produk berhasil diexport.");
    } catch (error) {
      setDatasetError(
        error instanceof ProductApiError
          ? error.message
          : "Export dataset produk gagal.",
      );
    } finally {
      setIsDatasetLoading(false);
    }
  };

  const handleSelectDatasetFile = async (
    event: ChangeEvent<HTMLInputElement>,
  ) => {
    const file = event.target.files?.[0] ?? null;

    setDatasetFile(file);
    setDatasetPreview(null);
    setImportResult(null);
    setDatasetError("");

    if (!file) return;

    setIsDatasetLoading(true);

    try {
      const preview = await productService.previewDatasetImport(file);
      setDatasetPreview(preview);
    } catch (error) {
      setDatasetError(
        error instanceof ProductApiError
          ? error.message
          : "Preview import dataset produk gagal.",
      );
    } finally {
      setIsDatasetLoading(false);
      event.target.value = "";
    }
  };

  const handleImportDataset = async () => {
    if (!datasetFile) return;

    setDatasetError("");
    setImportResult(null);
    setIsDatasetLoading(true);

    try {
      const result = await productService.importDataset(datasetFile);

      setImportResult(result);
      setDatasetPreview(null);
      setDatasetFile(null);
      await fetchProducts();
    } catch (error) {
      setDatasetError(
        error instanceof ProductApiError
          ? error.message
          : "Import dataset produk gagal.",
      );
    } finally {
      setIsDatasetLoading(false);
    }
  };

  const closeResetDialog = () => {
    if (isResetting) return;
    setIsResetDialogOpen(false);
    setResetConfirmation("");
    setResetError("");
  };

  const handleResetDataset = async () => {
    if (resetConfirmation !== resetConfirmationText) return;

    setIsResetting(true);
    setResetError("");
    setResetResult(null);

    try {
      const result = await settingsService.resetProductDataset();
      setResetResult(result);
      setIsResetDialogOpen(false);
      setResetConfirmation("");
      setDatasetFile(null);
      setDatasetPreview(null);
      setImportResult(null);
      await Promise.all([
        fetchProducts(),
        fetchCategories(),
        fetchSuppliers(),
      ]);
    } catch (error) {
      setResetError(
        error instanceof SettingsApiError
          ? error.message
          : "Dataset produk gagal dihapus.",
      );
    } finally {
      setIsResetting(false);
    }
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

        {user?.role === "OWNER" ? (
          <Card as="section" className="p-5">
            <div className="border-b border-gray-200 pb-4">
              <h2 className="text-lg font-semibold text-gray-900">
                Pengaturan Struk
              </h2>
              <p className="mt-1 text-sm text-gray-500">
                Atur teks yang tampil pada bagian paling bawah struk.
              </p>
            </div>

            <div className="mt-5 space-y-4">
              <label className="block space-y-2">
                <span className="text-sm font-medium text-gray-700">
                  Footer Struk
                </span>
                <Textarea
                  rows={5}
                  maxLength={250}
                  value={receiptFooter}
                  onChange={(event) => {
                    const value = event.target.value.replace(/\r\n?/g, "\n");
                    if (value.split("\n").length <= 5) {
                      setReceiptFooterInput(value);
                    }
                  }}
                  placeholder="Terima kasih"
                />
              </label>

              <div className="flex justify-between text-xs text-gray-500">
                <span>{receiptFooter.split("\n").length}/5 baris</span>
                <span>{receiptFooter.length}/250 karakter</span>
              </div>

              <div className="rounded-lg border border-dashed border-gray-300 bg-gray-50 p-4">
                <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                  Preview
                </p>
                <p className="mt-3 whitespace-pre-line text-center text-sm font-semibold text-gray-800">
                  {receiptFooter.trim() || "Terima kasih"}
                </p>
              </div>

              <div className="flex justify-end border-t border-gray-200 pt-5">
                <Button
                  onClick={() => void handleSaveReceiptFooter()}
                  disabled={isSavingReceiptFooter}
                >
                  <Save className="h-4 w-4" />
                  {isSavingReceiptFooter ? "Menyimpan..." : "Simpan"}
                </Button>
              </div>
            </div>
          </Card>
        ) : null}

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

        <Card as="section" className="p-5">
          <div className="border-b border-gray-200 pb-4">
            <h2 className="text-lg font-semibold text-gray-900">
              Dataset Produk
            </h2>
            <p className="mt-1 text-sm text-gray-500">
              Export dan import data master produk antar toko.
            </p>
          </div>

          <div className="mt-5 flex flex-col gap-3 sm:flex-row">
            <Button
              variant="secondary"
              onClick={handleExportDataset}
              disabled={isDatasetLoading}
            >
              <FileSpreadsheet className="h-4 w-4" />
              Export Dataset Produk
            </Button>
            <Button
              onClick={() => fileInputRef.current?.click()}
              disabled={isDatasetLoading}
            >
              <Upload className="h-4 w-4" />
              Import Dataset Produk
            </Button>
            <Input
              ref={fileInputRef}
              type="file"
              accept=".xlsx"
              className="hidden"
              onChange={handleSelectDatasetFile}
            />
          </div>

          {datasetError ? (
            <p className="mt-5 rounded-lg bg-red-50 px-3 py-2 text-sm font-medium text-red-700">
              {datasetError}
            </p>
          ) : null}

          {datasetPreview ? (
            <div className="mt-5 rounded-lg border border-gray-200 p-4">
              <h3 className="text-sm font-semibold text-gray-900">
                Ringkasan Import
              </h3>
              <div className="mt-3 grid gap-3 text-sm text-gray-600 sm:grid-cols-3">
                <p>Total data: {datasetPreview.totalData}</p>
                <p>Produk baru: {datasetPreview.newProducts}</p>
                <p>Barcode duplikat: {datasetPreview.duplicateBarcodes}</p>
              </div>
              <div className="mt-4 flex flex-col gap-3 sm:flex-row">
                <Button
                  onClick={handleImportDataset}
                  disabled={isDatasetLoading}
                >
                  Import Dataset
                </Button>
              </div>
            </div>
          ) : null}

          {importResult ? (
            <div className="mt-5 rounded-lg bg-emerald-50 px-3 py-2 text-sm font-medium text-emerald-700">
              Ditambahkan: {importResult.inserted}. Diperbarui:{" "}
              {importResult.updated}. Row duplikat dalam file dilewati:{" "}
              {importResult.skippedDuplicateRows}. Gagal: {importResult.failed}.
            </div>
          ) : null}

          {user?.role === "OWNER" ? (
            <div className="mt-6 border-t border-red-200 pt-5">
              <div className="rounded-lg border border-red-200 bg-red-50 p-4">
                <div className="flex items-start gap-3">
                  <AlertTriangle className="mt-0.5 h-5 w-5 text-red-600" />
                  <div className="flex-1">
                    <h3 className="font-semibold text-red-900">
                      Zona Berbahaya
                    </h3>
                    <p className="mt-1 text-sm text-red-700">
                      Hapus seluruh produk, kategori, supplier, dan riwayat stok
                      dari dataset toko ini.
                    </p>
                    <button
                      type="button"
                      onClick={() => {
                        setResetResult(null);
                        setResetError("");
                        setIsResetDialogOpen(true);
                      }}
                      className="mt-4 inline-flex h-11 items-center justify-center gap-2 rounded-lg bg-red-600 px-4 text-sm font-semibold text-white transition hover:bg-red-700"
                    >
                      <Trash2 className="h-4 w-4" />
                      Hapus Seluruh Dataset
                    </button>
                  </div>
                </div>
              </div>

              {resetResult ? (
                <div className="mt-4 rounded-lg bg-emerald-50 px-3 py-3 text-sm text-emerald-700">
                  <p className="font-semibold">Dataset berhasil dihapus.</p>
                  <p className="mt-1">
                    Produk: {resetResult.products}. Kategori: {resetResult.categories}.
                    Supplier: {resetResult.suppliers}. Riwayat stok:{" "}
                    {resetResult.stockHistories}.
                  </p>
                </div>
              ) : null}
            </div>
          ) : null}
        </Card>

        {isResetDialogOpen ? (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900/40 p-4">
            <div
              role="dialog"
              aria-modal="true"
              aria-labelledby="reset-dataset-title"
              className="w-full max-w-md rounded-lg bg-white p-5 shadow-xl"
            >
              <h2
                id="reset-dataset-title"
                className="text-lg font-semibold text-gray-900"
              >
                Hapus Seluruh Dataset
              </h2>
              <p className="mt-2 text-sm text-gray-600">
                Tindakan ini tidak dapat dibatalkan. Ketik{" "}
                <strong>{resetConfirmationText}</strong> untuk melanjutkan.
              </p>
              <Input
                className="mt-4"
                value={resetConfirmation}
                onChange={(event) => setResetConfirmation(event.target.value)}
                placeholder={resetConfirmationText}
                autoFocus
              />
              {resetError ? (
                <p className="mt-3 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
                  {resetError}
                </p>
              ) : null}
              <div className="mt-5 flex justify-end gap-3">
                <Button
                  variant="secondary"
                  onClick={closeResetDialog}
                  disabled={isResetting}
                >
                  Batal
                </Button>
                <button
                  type="button"
                  onClick={() => void handleResetDataset()}
                  disabled={
                    isResetting || resetConfirmation !== resetConfirmationText
                  }
                  className="inline-flex h-11 items-center justify-center gap-2 rounded-lg bg-red-600 px-4 text-sm font-semibold text-white transition hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <Trash2 className="h-4 w-4" />
                  {isResetting ? "Menghapus..." : "Hapus Dataset"}
                </button>
              </div>
            </div>
          </div>
        ) : null}
      </div>
    </MainLayout>
  );
}
