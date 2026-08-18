import { useCallback, useEffect, useRef, useState } from "react";
import type { SalesTransaction } from "../types/cashier";
import { useSettings } from "./useSettings";
import {
  beginBrowserReceiptPrint,
  completeBrowserReceiptPrint,
  type ReceiptPrinterConfig,
} from "../services/printing/browserReceiptPrinter";
import { printReceiptWithQzTray } from "../services/printing/qzTrayPrinter";
import type { PrinterBackend, ThermalPaperProfileId } from "../types/settings";

const RECEIPT_RENDER_DELAY_MS = 100;

export function useReceiptPrinter(onAfterPrint?: () => void) {
  const { settings } = useSettings();
  const [receiptPrintTransaction, setReceiptPrintTransaction] =
    useState<SalesTransaction | null>(null);
  const activeConfigRef = useRef<ReceiptPrinterConfig | null>(null);

  useEffect(() => {
    const handleAfterPrint = () => {
      if (activeConfigRef.current) {
        completeBrowserReceiptPrint(activeConfigRef.current);
        activeConfigRef.current = null;
      }
      setReceiptPrintTransaction(null);
      onAfterPrint?.();
    };

    window.addEventListener("afterprint", handleAfterPrint);

    return () => {
      window.removeEventListener("afterprint", handleAfterPrint);
      if (activeConfigRef.current) {
        completeBrowserReceiptPrint(activeConfigRef.current);
        activeConfigRef.current = null;
      }
    };
  }, [onAfterPrint]);

  const printReceipt = useCallback((
    transaction: SalesTransaction,
    overrides?: {
      printerBackend?: PrinterBackend;
      paperProfile?: ThermalPaperProfileId;
      printerName?: string;
    },
  ) => {
    const printerBackend = overrides?.printerBackend ?? settings.printerBackend;
    const paperProfile = overrides?.paperProfile ?? settings.thermalPaperProfile;
    const config: ReceiptPrinterConfig = {
      paperProfile,
      autoCut: settings.receiptAutoCut,
    };
    setReceiptPrintTransaction(transaction);
    if (printerBackend === "BROWSER") {
      activeConfigRef.current = config;
      beginBrowserReceiptPrint(config);
      window.setTimeout(() => window.print(), RECEIPT_RENDER_DELAY_MS);
      return;
    }

    if (printerBackend === "NODE_THERMAL_PRINTER") {
      return;
    }

    window.setTimeout(() => {
      const receiptElement = document.querySelector<HTMLElement>(".receipt-print-root");
      if (!receiptElement) {
        setReceiptPrintTransaction(null);
        window.alert("Area struk tidak tersedia untuk dicetak.");
        return;
      }
      void printReceiptWithQzTray(receiptElement, paperProfile, {
        printerName: overrides?.printerName ?? settings.selectedPrinterName,
      })
        .catch((error: unknown) => {
          window.alert(error instanceof Error ? error.message : "Gagal mencetak melalui QZ Tray.");
        })
        .finally(() => {
          setReceiptPrintTransaction(null);
          onAfterPrint?.();
        });
    }, RECEIPT_RENDER_DELAY_MS);
  }, [onAfterPrint, settings.printerBackend, settings.receiptAutoCut, settings.selectedPrinterName, settings.thermalPaperProfile]);

  return {
    receiptPrintTransaction,
    clearReceiptPrintTransaction: () => setReceiptPrintTransaction(null),
    printReceipt,
  };
}
