import { useCallback, useEffect, useRef, useState } from "react";
import type { SalesTransaction } from "../types/cashier";
import { useSettings } from "./useSettings";
import {
  beginBrowserReceiptPrint,
  completeBrowserReceiptPrint,
  type ReceiptPrinterConfig,
} from "../services/printing/browserReceiptPrinter";

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

  const printReceipt = useCallback((transaction: SalesTransaction) => {
    const config: ReceiptPrinterConfig = {
      paperWidth: settings.thermalPaperWidth,
      autoCut: settings.receiptAutoCut,
    };
    activeConfigRef.current = config;
    beginBrowserReceiptPrint(config);
    setReceiptPrintTransaction(transaction);
    window.setTimeout(() => window.print(), 100);
  }, [settings.receiptAutoCut, settings.thermalPaperWidth]);

  return {
    receiptPrintTransaction,
    printReceipt,
  };
}
