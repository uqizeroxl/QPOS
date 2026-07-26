import { Download, X } from "lucide-react";
import { useState } from "react";
import Button from "../../components/ui/Button";
import Card from "../../components/ui/Card";
import DatePicker from "../../components/ui/DatePicker";
import type { SalesTransaction } from "../../types/cashier";
import { createSalesReportPdf, downloadPdf } from "../../utils/reportPdf";
import { useSettings } from "../../hooks/useSettings";

type ReportExportModalProps = {
  isOpen: boolean;
  transactions: SalesTransaction[];
  onClose: () => void;
};

function getFirstDayOfCurrentMonth() {
  const today = new Date();

  return new Date(today.getFullYear(), today.getMonth(), 1);
}

function getToday() {
  const today = new Date();

  return new Date(today.getFullYear(), today.getMonth(), today.getDate());
}

function startOfDay(value: Date) {
  return new Date(value.getFullYear(), value.getMonth(), value.getDate());
}

function endOfDay(value: Date) {
  return new Date(
    value.getFullYear(),
    value.getMonth(),
    value.getDate(),
    23,
    59,
    59,
    999,
  );
}

function formatFileDate(value: Date) {
  const year = value.getFullYear();
  const month = (value.getMonth() + 1).toString().padStart(2, "0");
  const day = value.getDate().toString().padStart(2, "0");

  return `${year}-${month}-${day}`;
}

export default function ReportExportModal({
  isOpen,
  transactions,
  onClose,
}: ReportExportModalProps) {
  const { settings } = useSettings();
  const [startDate, setStartDate] = useState(getFirstDayOfCurrentMonth);
  const [endDate, setEndDate] = useState(getToday);
  const [errorMessage, setErrorMessage] = useState("");

  if (!isOpen) {
    return null;
  }

  const handleExport = () => {
    const normalizedStartDate = startOfDay(startDate);
    const normalizedEndDate = endOfDay(endDate);

    if (normalizedEndDate.getTime() < normalizedStartDate.getTime()) {
      setErrorMessage("Tanggal akhir tidak boleh lebih kecil dari tanggal awal.");
      return;
    }

    const filteredTransactions = transactions.filter((transaction) => {
      const transactionTime = new Date(transaction.createdAt).getTime();

      return (
        transactionTime >= normalizedStartDate.getTime() &&
        transactionTime <= normalizedEndDate.getTime()
      );
    });
    const pdfBlob = createSalesReportPdf({
      transactions: filteredTransactions,
      startDate: normalizedStartDate,
      endDate: normalizedEndDate,
      storeName: settings.storeName,
    });

    downloadPdf(
      pdfBlob,
      `laporan-penjualan-${formatFileDate(startDate)}-${formatFileDate(
        endDate,
      )}.pdf`,
    );
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900/40 p-4">
      <Card className="w-full max-w-lg border-0 shadow-xl">
        <div className="flex items-center justify-between border-b border-gray-200 px-5 py-4">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">
              Export Laporan
            </h2>
            <p className="text-sm text-gray-500">
              Pilih periode transaksi yang akan dibuat PDF.
            </p>
          </div>

          <Button variant="icon" onClick={onClose} aria-label="Tutup export">
            <X className="h-5 w-5" />
          </Button>
        </div>

        <div className="space-y-5 p-5">
          <div className="grid gap-4 sm:grid-cols-2">
            <DatePicker
              label="Tanggal Awal"
              value={startDate}
              onChange={(value) => {
                setStartDate(value);
                setErrorMessage("");
              }}
            />
            <DatePicker
              label="Tanggal Akhir"
              value={endDate}
              onChange={(value) => {
                setEndDate(value);
                setErrorMessage("");
              }}
            />
          </div>

          {errorMessage ? (
            <p className="rounded-lg bg-red-50 px-3 py-2 text-sm font-medium text-red-700">
              {errorMessage}
            </p>
          ) : null}

          <div className="flex flex-col-reverse gap-3 border-t border-gray-200 pt-5 sm:flex-row sm:justify-end">
            <Button variant="secondary" onClick={onClose}>
              Batal
            </Button>
            <Button onClick={handleExport}>
              <Download className="h-4 w-4" />
              Export PDF
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
}
