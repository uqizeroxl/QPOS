import { useCallback, useEffect, useState } from "react";
import type { SalesTransaction } from "../types/cashier";

export function useReceiptPrinter(onAfterPrint?: () => void) {
  const [receiptPrintTransaction, setReceiptPrintTransaction] =
    useState<SalesTransaction | null>(null);

  useEffect(() => {
    const handleAfterPrint = () => {
      setReceiptPrintTransaction(null);
      onAfterPrint?.();
    };

    window.addEventListener("afterprint", handleAfterPrint);

    return () => {
      window.removeEventListener("afterprint", handleAfterPrint);
    };
  }, [onAfterPrint]);

  const printReceipt = useCallback((transaction: SalesTransaction) => {
    setReceiptPrintTransaction(transaction);
    window.setTimeout(() => window.print(), 100);
  }, []);

  return {
    receiptPrintTransaction,
    printReceipt,
  };
}
