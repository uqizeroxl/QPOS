import { useCallback, useEffect, useState } from "react";
import type { SalesTransaction } from "../types/cashier";

const RECEIPT_PAGE_STYLE_ID = "qpos-receipt-page-style";

function enterReceiptPrintMode() {
  document.body.classList.add("receipt-printing");

  let pageStyle = document.getElementById(RECEIPT_PAGE_STYLE_ID);
  if (!pageStyle) {
    pageStyle = document.createElement("style");
    pageStyle.id = RECEIPT_PAGE_STYLE_ID;
    pageStyle.textContent = "@page { size: 80mm auto; margin: 0; }";
    document.head.appendChild(pageStyle);
  }
}

function leaveReceiptPrintMode() {
  document.body.classList.remove("receipt-printing");
  document.getElementById(RECEIPT_PAGE_STYLE_ID)?.remove();
}

export function useReceiptPrinter(onAfterPrint?: () => void) {
  const [receiptPrintTransaction, setReceiptPrintTransaction] =
    useState<SalesTransaction | null>(null);

  useEffect(() => {
    const handleAfterPrint = () => {
      leaveReceiptPrintMode();
      setReceiptPrintTransaction(null);
      onAfterPrint?.();
    };

    window.addEventListener("afterprint", handleAfterPrint);

    return () => {
      window.removeEventListener("afterprint", handleAfterPrint);
      leaveReceiptPrintMode();
    };
  }, [onAfterPrint]);

  const printReceipt = useCallback((transaction: SalesTransaction) => {
    enterReceiptPrintMode();
    setReceiptPrintTransaction(transaction);
    window.setTimeout(() => window.print(), 100);
  }, []);

  return {
    receiptPrintTransaction,
    printReceipt,
  };
}
