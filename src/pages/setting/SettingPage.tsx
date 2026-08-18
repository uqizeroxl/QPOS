import {
  AlertTriangle,
  DatabaseBackup,
  FileSpreadsheet,
  HardDrive,
  Mail,
  Save,
  Settings,
  Shield,
  Store,
  Trash2,
  Upload,
  Users,
} from "lucide-react";
import { useContext, useEffect, useRef, useState } from "react";
import type { ChangeEvent } from "react";
import Button from "../../components/ui/Button";
import Card from "../../components/ui/Card";
import { Input, Select, Textarea } from "../../components/ui/Input";
import { useProducts } from "../../hooks/useProducts";
import { useAuth } from "../../hooks/useAuth";
import { useCategories } from "../../hooks/useCategories";
import { NetworkContext } from "../../contexts/NetworkContext";
import { useSettings } from "../../hooks/useSettings";
import { useSuppliers } from "../../hooks/useSuppliers";
import { useTheme } from "../../hooks/useTheme";
import { useToast } from "../../hooks/useToast";
import MainLayout from "../../layouts/MainLayout";
import type { ThemePreference } from "../../contexts/themeContextValue";
import type { ThermalPaperProfileId, ThermalPrinterType } from "../../types/settings";
import type { PrinterBackend } from "../../types/settings";
import type { SalesTransaction } from "../../types/cashier";
import ReceiptPrintArea from "../cashier/ReceiptPrintArea";
import { useReceiptPrinter } from "../../hooks/useReceiptPrinter";
import { refreshPrinters, testQzTrayConnection } from "../../services/printing/qzTrayPrinter";
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
import {
  ThermalPrinterApiError,
  ThermalPrinterConnectionError,
  thermalPrinterService,
} from "../../services/printing/thermalPrinterService";
import SystemSettingsTab from "./SystemSettingsTab";

const resetConfirmationText = "HAPUS SEMUA";

type Tab = "store" | "dataset" | "security" | "system";

const tabs: { key: Tab; label: string; icon: typeof Store; ownerOnly: boolean }[] = [
  { key: "store", label: "Informasi Toko", icon: Store, ownerOnly: false },
  { key: "dataset", label: "Dataset Produk", icon: HardDrive, ownerOnly: false },
  { key: "security", label: "Keamanan", icon: Shield, ownerOnly: true },
  { key: "system", label: "Sistem", icon: Settings, ownerOnly: false },
];

export default function SettingPage() {
  const { settings, saveSettings, setReceiptSettings } = useSettings();
  const { user } = useAuth();
  const { isOnline, pendingCount } = useContext(NetworkContext);
  const { theme, setTheme } = useTheme();
  const { fetchProducts } = useProducts();
  const { fetchCategories } = useCategories();
  const { fetchSuppliers } = useSuppliers();
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [storeInfo, setStoreInfo] = useState(settings);
  const { showToast } = useToast();
  const [activeTab, setActiveTab] = useState<Tab>("store");
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
  const [thermalPaperProfile, setThermalPaperProfile] = useState<ThermalPaperProfileId>(settings.thermalPaperProfile);
  const [receiptAutoCut, setReceiptAutoCut] = useState(settings.receiptAutoCut);
  const [printerBackend, setPrinterBackend] = useState<PrinterBackend>(settings.printerBackend);
  const [isTestingQz, setIsTestingQz] = useState(false);
  const [selectedPrinterName, setSelectedPrinterName] = useState(settings.selectedPrinterName);
  const [thermalPrinterType, setThermalPrinterType] = useState<ThermalPrinterType>(settings.thermalPrinterType);
  const [isThermalPrinterSetupOpen, setIsThermalPrinterSetupOpen] = useState(false);
  const [isTestingThermalPrinter, setIsTestingThermalPrinter] = useState(false);
  const [thermalPrinterSetupMessage, setThermalPrinterSetupMessage] = useState("");
  const [availablePrinters, setAvailablePrinters] = useState<string[]>([]);
  const [isRefreshingPrinters, setIsRefreshingPrinters] = useState(false);
  const {
    receiptPrintTransaction,
    clearReceiptPrintTransaction,
    printReceipt,
  } = useReceiptPrinter();
  const [isChangeOwnerDialogOpen, setIsChangeOwnerDialogOpen] = useState(false);
  const [changeOwnerEmail, setChangeOwnerEmail] = useState("");
  const [changeOwnerStoreName, setChangeOwnerStoreName] = useState("");
  const [changeOwnerStatement, setChangeOwnerStatement] = useState("");
  const [changeOwnerError, setChangeOwnerError] = useState("");
  const [isChangingOwner, setIsChangingOwner] = useState(false);
  const [changeOwnerResult, setChangeOwnerResult] = useState<string | null>(null);
  const [inviteLink, setInviteLink] = useState("");
  const [isDeleteCompanyDialogOpen, setIsDeleteCompanyDialogOpen] = useState(false);
  const [deleteCompanyStoreName, setDeleteCompanyStoreName] = useState("");
  const [deleteCompanyStatement, setDeleteCompanyStatement] = useState("");
  const [deleteCompanyError, setDeleteCompanyError] = useState("");
  const [isDeletingCompany, setIsDeletingCompany] = useState(false);

  useEffect(() => {
    setStoreInfo(settings);
    setReceiptFooterInput(settings.receiptFooter);
    setThermalPaperProfile(settings.thermalPaperProfile);
    setReceiptAutoCut(settings.receiptAutoCut);
    setPrinterBackend(settings.printerBackend);
    setSelectedPrinterName(settings.selectedPrinterName);
    setThermalPrinterType(settings.thermalPrinterType);
  }, [
    settings.address,
    settings.phone,
    settings.receiptAutoCut,
    settings.receiptFooter,
    settings.printerBackend,
    settings.selectedPrinterName,
    settings.storeName,
    settings.thermalPaperProfile,
    settings.thermalPrinterType,
  ]);

  const handleSave = async () => {
    try {
      await saveSettings({
        ...storeInfo,
        receiptFooter: settings.receiptFooter,
        thermalPaperProfile: settings.thermalPaperProfile,
        receiptAutoCut: settings.receiptAutoCut,
        printerBackend: settings.printerBackend,
        selectedPrinterName: settings.selectedPrinterName,
        thermalPrinterType: settings.thermalPrinterType,
      });
      showToast("Pengaturan toko berhasil disimpan.");
    } catch {
      showToast("Pengaturan toko gagal disimpan.", "error");
    }
  };

  const handleBackup = () => {
    showToast("Backup data lokal berhasil dibuat.");
  };

  const handleSaveReceiptFooter = async () => {
    setIsSavingReceiptFooter(true);

    try {
      const result = await settingsService.updateReceiptFooter({
        receiptFooter,
        thermalPaperProfile,
        receiptAutoCut,
        printerBackend,
        selectedPrinterName,
        thermalPrinterType,
      });
      setReceiptFooterInput(result.receiptFooter);
      setReceiptSettings(result);
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

  const persistPrinterSettings = async (nextSettings: {
    printerBackend: PrinterBackend;
    selectedPrinterName: string;
    thermalPrinterType: ThermalPrinterType;
  }) => {
    try {
      await saveSettings({
        ...storeInfo,
        receiptFooter: settings.receiptFooter,
        thermalPaperProfile: settings.thermalPaperProfile,
        receiptAutoCut: settings.receiptAutoCut,
        printerBackend: nextSettings.printerBackend,
        selectedPrinterName: nextSettings.selectedPrinterName,
        thermalPrinterType: nextSettings.thermalPrinterType,
      });
    } catch {
      showToast("Pengaturan printer gagal disimpan.", "error");
    }
  };

  const handleTestQzConnection = async () => {
    setIsTestingQz(true);
    try {
      const result = await testQzTrayConnection();
      setAvailablePrinters(result.printers);
      const printerSummary = result.printers.length > 0
        ? `${result.printers.length} printer terdeteksi.`
        : "Tidak ada printer terdeteksi.";
      showToast(`QZ Tray ${result.version} terhubung. ${printerSummary}`);
    } catch (error) {
      showToast(error instanceof Error ? error.message : "Koneksi QZ Tray gagal.", "error");
    } finally {
      setIsTestingQz(false);
    }
  };

  const handleRefreshPrinters = async () => {
    setIsRefreshingPrinters(true);
    try {
      const printers = await refreshPrinters();
      setAvailablePrinters(printers);
      showToast(`${printers.length} printer berhasil dimuat.`);
    } catch (error) {
      showToast(error instanceof Error ? error.message : "Daftar printer gagal dimuat.", "error");
    } finally {
      setIsRefreshingPrinters(false);
    }
  };

  const handleTestPrint = () => {
    const testTransaction: SalesTransaction = {
      id: "qz-test-print",
      transactionNumber: "TEST-PRINT",
      items: [{ productId: "test", barcode: "TEST", name: "Test Print QPOS", price: 1000, quantity: 1, subtotal: 1000 }],
      subtotal: 1000,
      discountPercent: 0,
      discountAmount: 0,
      grandTotal: 1000,
      paidAmount: 1000,
      change: 0,
      cashierName: user?.name ?? "QPOS",
      createdAt: new Date().toISOString(),
    };
    printReceipt(testTransaction, {
      printerBackend,
      paperProfile: thermalPaperProfile,
      printerName: selectedPrinterName,
    });
  };

  const handleTestThermalPrinterConnection = async () => {
    setIsTestingThermalPrinter(true);
    setThermalPrinterSetupMessage("Mencari printer thermal...");

    try {
      await thermalPrinterService.testConnection();
      setThermalPrinterSetupMessage("Printer thermal terhubung.");
      showToast("Printer thermal terhubung.");
    } catch (error) {
      const message =
        error instanceof ThermalPrinterConnectionError || error instanceof ThermalPrinterApiError
          ? error.message
          : "Koneksi printer thermal gagal.";
      setThermalPrinterSetupMessage(message);
      showToast(message, "error");
    } finally {
      setIsTestingThermalPrinter(false);
    }
  };

  const handleScanThermalPrinters = async () => {
    try {
      const result = await thermalPrinterService.scanPrinters();
      const chosenPrinter = result.defaultPrinter || result.printers[0]?.name || "";
      const printerList = result.printers.map((printer) => printer.name).filter(Boolean);
      const hasDefaultPrinter = Boolean(result.defaultPrinter);
      const printerNameMessage = chosenPrinter
        ? `Printer aktif: ${chosenPrinter}.`
        : "Tidak ada printer aktif yang terdeteksi.";

      if (chosenPrinter) {
        setSelectedPrinterName(chosenPrinter);
        await persistPrinterSettings({
          printerBackend,
          selectedPrinterName: chosenPrinter,
          thermalPrinterType,
        });
      }
      setThermalPrinterSetupMessage(
        result.printers.length > 0
          ? `Ditemukan ${result.printers.length} printer sistem. ${printerNameMessage}`
          : "Tidak ada printer sistem yang terdeteksi.",
      );
      showToast(
        hasDefaultPrinter
          ? `Default printer terdeteksi: ${result.defaultPrinter}.`
          : printerList.length > 0
            ? `Printer terdeteksi, tetapi tidak ada default printer. ${printerNameMessage}`
            : "Tidak ada printer sistem yang terdeteksi.",
        hasDefaultPrinter ? undefined : "error",
      );
    } catch (error) {
      const message =
        error instanceof ThermalPrinterConnectionError || error instanceof ThermalPrinterApiError
          ? error.message
          : "Gagal memindai printer sistem.";
      setThermalPrinterSetupMessage(message);
      showToast(message, "error");
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

  const closeChangeOwnerDialog = () => {
    if (isChangingOwner) return;
    setIsChangeOwnerDialogOpen(false);
    setChangeOwnerEmail("");
    setChangeOwnerStoreName("");
    setChangeOwnerStatement("");
    setChangeOwnerError("");
    setInviteLink("");
  };

  const handleSendInvitation = async () => {
    if (
      !changeOwnerEmail ||
      changeOwnerStoreName !== settings.storeName ||
      changeOwnerStatement !== "Saya mengerti dan ingin melanjutkan"
    ) {
      return;
    }

    setIsChangingOwner(true);
    setChangeOwnerError("");

    try {
      const result = await settingsService.inviteOwner(changeOwnerEmail);
      setInviteLink(result.inviteLink);
      setChangeOwnerResult(result.email);
    } catch (error) {
      setChangeOwnerError(
        error instanceof SettingsApiError
          ? error.message
          : "Gagal membuat undangan.",
      );
    } finally {
      setIsChangingOwner(false);
    }
  };

  const openGmailCompose = () => {
    const subject = encodeURIComponent("Undangan Kepemilikan Toko");
    const body = encodeURIComponent(
      `Halo,\n\nAnda telah diundang untuk menjadi pemilik toko.\n\nKlik link berikut untuk menerima:\n${inviteLink}\n\nLink ini berlaku selama 48 jam.`
    );
    window.open(`https://mail.google.com/mail/?view=cm&fs=1&to=${encodeURIComponent(changeOwnerResult || changeOwnerEmail)}&su=${subject}&body=${body}`, "_blank");
  };

  const closeDeleteCompanyDialog = () => {
    if (isDeletingCompany) return;
    setIsDeleteCompanyDialogOpen(false);
    setDeleteCompanyStoreName("");
    setDeleteCompanyStatement("");
    setDeleteCompanyError("");
  };

  const handleDeleteCompany = async () => {
    if (
      deleteCompanyStoreName !== settings.storeName ||
      deleteCompanyStatement !== "Saya mengerti dan ingin melanjutkan"
    ) {
      return;
    }

    setIsDeletingCompany(true);
    setDeleteCompanyError("");

    try {
      await settingsService.deleteCompany("HAPUS PERUSAHAAN");
      setIsDeleteCompanyDialogOpen(false);
      window.location.href = "/login";
    } catch (error) {
      setDeleteCompanyError(
        error instanceof SettingsApiError
          ? error.message
          : "Gagal menghapus perusahaan.",
      );
    } finally {
      setIsDeletingCompany(false);
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

  const availableTabs = tabs.filter((t) => !t.ownerOnly || user?.role === "OWNER");

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

          <div className={`flex items-center gap-3 rounded-lg px-4 py-3 ${isOnline ? "bg-blue-50 text-blue-700" : "bg-amber-50 text-amber-800"}`}>
            <Settings className="h-5 w-5" />
            <div>
              <p className="text-sm font-semibold">{settings.storeName}</p>
              <p className="text-xs">
                {isOnline
                  ? pendingCount > 0
                    ? `Menyinkronkan ${pendingCount} perubahan`
                    : "Tersimpan di server"
                  : `Offline, ${pendingCount} perubahan menunggu`}
              </p>
            </div>
          </div>
        </Card>

        <div className="border-b border-gray-200">
          <nav className="-mb-px flex gap-6" role="tablist">
            {availableTabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.key}
                  role="tab"
                  aria-selected={activeTab === tab.key}
                  onClick={() => setActiveTab(tab.key)}
                  className={`inline-flex items-center gap-2 border-b-2 px-1 pb-3 text-sm font-medium transition ${
                    activeTab === tab.key
                      ? "border-blue-600 text-blue-600"
                      : "border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700"
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  {tab.label}
                </button>
              );
            })}
          </nav>
        </div>

        {activeTab === "store" ? (
          <div className="space-y-6">
            <Card as="section" className="p-5">
              <div className="flex flex-col gap-3 border-b border-gray-200 pb-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <h2 className="text-lg font-semibold text-gray-900">
                    Informasi Toko
                  </h2>
                  <p className="mt-1 text-sm text-gray-500">
                    Data ini digunakan sebagai identitas toko pada aplikasi POS.
                  </p>
                </div>
                <span className={`inline-flex w-fit items-center rounded-full px-3 py-1 text-xs font-semibold ${isOnline ? "bg-emerald-50 text-emerald-700" : "bg-amber-50 text-amber-700"}`}>
                  {isOnline ? (pendingCount > 0 ? "Belum sinkron penuh" : "Server aktif") : "Offline"}
                </span>
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
                <Button variant="secondary" onClick={handleBackup}>
                  <DatabaseBackup className="h-4 w-4" />
                  Backup Database
                </Button>
                <Button onClick={handleSave}>
                  <Save className="h-4 w-4" />
                  Simpan
                </Button>
              </div>
            </Card>

          </div>
        ) : null}

        {activeTab === "dataset" ? (
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
        ) : null}

        {activeTab === "security" && user?.role === "OWNER" ? (
          <Card as="section" className="border-2 border-red-300 p-5">
            <div className="border-b border-red-200 pb-4">
              <h2 className="text-lg font-semibold text-red-800">Keamanan</h2>
              <p className="mt-1 text-sm text-red-600">
                Tindakan berbahaya yang mempengaruhi kepemilikan dan keberadaan toko.
              </p>
            </div>

            <div className="mt-5 space-y-4">
              <div className="rounded-lg border border-red-200 bg-gray-50 p-4">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <h3 className="font-semibold text-red-900">
                      Alihkan Kepemilikan Toko
                    </h3>
                    <p className="mt-1 text-sm text-red-700">
                      Transfer kepemilikan toko ke pengguna lain. Anda akan
                      menjadi Manajer setelah dialihkan.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setChangeOwnerResult(null);
                      setChangeOwnerError("");
                      setIsChangeOwnerDialogOpen(true);
                    }}
                    className="inline-flex shrink-0 items-center gap-2 rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-red-700"
                  >
                    <Users className="h-4 w-4" />
                    Alihkan
                  </button>
                </div>
              </div>

              <div className="rounded-lg border border-red-200 bg-gray-50 p-4">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <h3 className="font-semibold text-red-900">
                      Hapus Perusahaan
                    </h3>
                    <p className="mt-1 text-sm text-red-700">
                      Hapus toko dan seluruh data secara permanen. Tindakan ini
                      tidak dapat dibatalkan.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setDeleteCompanyError("");
                      setIsDeleteCompanyDialogOpen(true);
                    }}
                    className="inline-flex shrink-0 items-center gap-2 rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-red-700"
                  >
                    <Trash2 className="h-4 w-4" />
                    Hapus
                  </button>
                </div>
              </div>

              {changeOwnerResult ? (
                <div className="rounded-lg bg-emerald-50 px-3 py-3 text-sm text-emerald-700">
                  <p className="font-semibold">Kepemilikan berhasil dialihkan.</p>
                  <p className="mt-1">
                    Pemilik baru: {changeOwnerResult}. Silakan login ulang.
                  </p>
                </div>
              ) : null}
            </div>
          </Card>
        ) : null}

        {activeTab === "system" ? (
          <SystemSettingsTab
            receiptFooter={receiptFooter}
            isSavingReceiptFooter={isSavingReceiptFooter}
            thermalPaperProfile={thermalPaperProfile}
            receiptAutoCut={receiptAutoCut}
            printerBackend={printerBackend}
            isTestingQz={isTestingQz}
            selectedPrinterName={selectedPrinterName}
            thermalPrinterType={thermalPrinterType}
            availablePrinters={availablePrinters}
            isRefreshingPrinters={isRefreshingPrinters}
            onReceiptFooterChange={setReceiptFooterInput}
            onSaveReceiptFooter={handleSaveReceiptFooter}
            onThermalPaperProfileChange={setThermalPaperProfile}
            onReceiptAutoCutChange={setReceiptAutoCut}
            onPrinterBackendChange={(value) => {
              setPrinterBackend(value);
              void persistPrinterSettings({
                printerBackend: value,
                selectedPrinterName,
                thermalPrinterType,
              });
            }}
            onTestQz={handleTestQzConnection}
            onTestPrint={handleTestPrint}
            onSelectedPrinterNameChange={(value) => {
              setSelectedPrinterName(value);
              void persistPrinterSettings({
                printerBackend,
                selectedPrinterName: value,
                thermalPrinterType,
              });
            }}
            onThermalPrinterTypeChange={(value) => {
              setThermalPrinterType(value);
              void persistPrinterSettings({
                printerBackend,
                selectedPrinterName,
                thermalPrinterType: value,
              });
            }}
            onOpenThermalPrinterSetup={() => {
              setThermalPrinterSetupMessage("");
              setIsThermalPrinterSetupOpen(true);
            }}
            onScanThermalPrinters={handleScanThermalPrinters}
            onRefreshPrinters={handleRefreshPrinters}
          />
        ) : null}

        <ReceiptPrintArea
          transaction={receiptPrintTransaction}
          onClosePreview={clearReceiptPrintTransaction}
        />

        {isThermalPrinterSetupOpen ? (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900/40 p-4">
            <div
              role="dialog"
              aria-modal="true"
              aria-labelledby="thermal-printer-setup-title"
              className="w-full max-w-lg rounded-lg bg-white p-5 shadow-xl"
            >
              <h2
                id="thermal-printer-setup-title"
                className="text-lg font-semibold text-gray-900"
              >
                Setup Printer Thermal
              </h2>
              <p className="mt-2 text-sm text-gray-600">
                Gunakan panel ini untuk mengecek apakah printer thermal yang kamu set sudah bisa dihubungi oleh server.
              </p>
              <div className="mt-4 space-y-3 rounded-lg border border-gray-200 bg-gray-50 p-4 text-sm text-gray-700">
                <p>1. Sambungkan printer ke jaringan atau server.</p>
                <p>2. Isi interface printer di bawah format seperti <code>tcp://192.168.1.50:9100</code>.</p>
                <p>3. Tekan tombol cek koneksi untuk menunggu printer siap.</p>
              </div>
              <div className="mt-4 flex flex-col gap-3 sm:flex-row">
                <Button
                  onClick={() => void handleTestThermalPrinterConnection()}
                  disabled={isTestingThermalPrinter}
                >
                  {isTestingThermalPrinter ? "Mengecek..." : "Tunggu Printer Terhubung"}
                </Button>
                <Button variant="secondary" onClick={() => setIsThermalPrinterSetupOpen(false)}>
                  Tutup
                </Button>
              </div>
              {thermalPrinterSetupMessage ? (
                <p className="mt-4 rounded-lg bg-blue-50 px-3 py-2 text-sm text-blue-700">
                  {thermalPrinterSetupMessage}
                </p>
              ) : null}
            </div>
          </div>
        ) : null}

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

        {isChangeOwnerDialogOpen ? (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900/40 p-4">
            <div
              role="dialog"
              aria-modal="true"
              aria-labelledby="change-owner-title"
              className="w-full max-w-md rounded-lg bg-white p-5 shadow-xl"
            >
              <h2
                id="change-owner-title"
                className="text-lg font-semibold text-gray-900"
              >
                Alihkan Kepemilikan Toko
              </h2>

              {inviteLink ? (
                <>
                  <p className="mt-2 text-sm text-gray-600">
                    Undangan berhasil dibuat. Kirim link ini ke pemilik baru
                    melalui Gmail.
                  </p>

                  <div className="mt-4 rounded-lg border border-gray-200 bg-gray-50 p-3">
                    <p className="text-xs font-medium text-gray-500">
                      Link Undangan
                    </p>
                    <p className="mt-1 break-all text-sm text-blue-600">
                      {inviteLink}
                    </p>
                  </div>

                  {changeOwnerError ? (
                    <p className="mt-3 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
                      {changeOwnerError}
                    </p>
                  ) : null}

                  <div className="mt-5 flex justify-end gap-3">
                    <Button
                      variant="secondary"
                      onClick={closeChangeOwnerDialog}
                    >
                      Tutup
                    </Button>
                    <button
                      type="button"
                      onClick={openGmailCompose}
                      className="inline-flex h-11 items-center justify-center gap-2 rounded-lg bg-red-600 px-4 text-sm font-semibold text-white transition hover:bg-red-700"
                    >
                      <Mail className="h-4 w-4" />
                      Kirim via Gmail
                    </button>
                  </div>
                </>
              ) : (
                <>
                  <p className="mt-2 text-sm text-gray-600">
                    Masukkan email pemilik baru dan konfirmasi untuk membuat
                    undangan kepemilikan.
                  </p>

                  <div className="mt-5 rounded-lg border border-red-200 bg-red-50 p-4">
                    <p className="text-sm font-semibold text-red-800">
                      Konfirmasi
                    </p>
                    <div className="mt-3 space-y-3">
                      <label className="block space-y-1">
                        <span className="text-sm font-medium text-gray-700">
                          Ketik nama toko{" "}
                          <strong>{settings.storeName}</strong>
                        </span>
                        <Input
                          value={changeOwnerStoreName}
                          onChange={(event) =>
                            setChangeOwnerStoreName(event.target.value)
                          }
                          placeholder={settings.storeName}
                        />
                      </label>
                      <label className="block space-y-1">
                        <span className="text-sm font-medium text-gray-700">
                          Ketik{" "}
                          <strong>
                            Saya mengerti dan ingin melanjutkan
                          </strong>
                        </span>
                        <Input
                          value={changeOwnerStatement}
                          onChange={(event) =>
                            setChangeOwnerStatement(event.target.value)
                          }
                          placeholder="Saya mengerti dan ingin melanjutkan"
                        />
                      </label>
                    </div>
                  </div>

                  <div className="mt-4">
                    <label className="block space-y-2">
                      <span className="text-sm font-medium text-gray-700">
                        Email Pemilik Baru
                      </span>
                      <Input
                        value={changeOwnerEmail}
                        onChange={(event) =>
                          setChangeOwnerEmail(event.target.value)
                        }
                        placeholder="contoh@email.com"
                      />
                    </label>
                  </div>

                  {changeOwnerError ? (
                    <p className="mt-3 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
                      {changeOwnerError}
                    </p>
                  ) : null}

                  <div className="mt-5 flex justify-end gap-3">
                    <Button
                      variant="secondary"
                      onClick={closeChangeOwnerDialog}
                      disabled={isChangingOwner}
                    >
                      Batal
                    </Button>
                    <button
                      type="button"
                      onClick={() => void handleSendInvitation()}
                      disabled={
                        isChangingOwner ||
                        changeOwnerStoreName !== settings.storeName ||
                        changeOwnerStatement !==
                          "Saya mengerti dan ingin melanjutkan" ||
                        !changeOwnerEmail
                      }
                      className="inline-flex h-11 items-center justify-center gap-2 rounded-lg bg-red-600 px-4 text-sm font-semibold text-white transition hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      <Users className="h-4 w-4" />
                      {isChangingOwner
                        ? "Membuat Undangan..."
                        : "Buat Undangan"}
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        ) : null}

        {isDeleteCompanyDialogOpen ? (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900/40 p-4">
            <div
              role="dialog"
              aria-modal="true"
              aria-labelledby="delete-company-title"
              className="w-full max-w-md rounded-lg bg-white p-5 shadow-xl"
            >
              <h2
                id="delete-company-title"
                className="text-lg font-semibold text-gray-900"
              >
                Hapus Perusahaan
              </h2>
              <p className="mt-2 text-sm text-gray-600">
                Tindakan ini tidak dapat dibatalkan. Seluruh data toko akan
                dihapus permanen. Isi kolom di bawah untuk konfirmasi.
              </p>

              <div className="mt-5 rounded-lg border border-red-200 bg-red-50 p-4">
                <p className="text-sm font-semibold text-red-800">Konfirmasi</p>
                <div className="mt-3 space-y-3">
                  <label className="block space-y-1">
                    <span className="text-sm font-medium text-gray-700">
                      Ketik nama toko <strong>{settings.storeName}</strong>
                    </span>
                    <Input
                      value={deleteCompanyStoreName}
                      onChange={(event) =>
                        setDeleteCompanyStoreName(event.target.value)
                      }
                      placeholder={settings.storeName}
                      autoFocus
                    />
                  </label>
                  <label className="block space-y-1">
                    <span className="text-sm font-medium text-gray-700">
                      Ketik <strong>Saya mengerti dan ingin melanjutkan</strong>
                    </span>
                    <Input
                      value={deleteCompanyStatement}
                      onChange={(event) =>
                        setDeleteCompanyStatement(event.target.value)
                      }
                      placeholder="Saya mengerti dan ingin melanjutkan"
                    />
                  </label>
                </div>
              </div>

              {deleteCompanyError ? (
                <p className="mt-3 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
                  {deleteCompanyError}
                </p>
              ) : null}
              <div className="mt-5 flex justify-end gap-3">
                <Button
                  variant="secondary"
                  onClick={closeDeleteCompanyDialog}
                  disabled={isDeletingCompany}
                >
                  Batal
                </Button>
                <button
                  type="button"
                  onClick={() => void handleDeleteCompany()}
                  disabled={
                    isDeletingCompany ||
                    deleteCompanyStoreName !== settings.storeName ||
                    deleteCompanyStatement !== "Saya mengerti dan ingin melanjutkan"
                  }
                  className="inline-flex h-11 items-center justify-center gap-2 rounded-lg bg-red-600 px-4 text-sm font-semibold text-white transition hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <Trash2 className="h-4 w-4" />
                  {isDeletingCompany ? "Menghapus..." : "Hapus Perusahaan"}
                </button>
              </div>
            </div>
          </div>
        ) : null}
      </div>
    </MainLayout>
  );
}
