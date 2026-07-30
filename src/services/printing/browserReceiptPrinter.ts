import { getThermalPaperProfile, type ThermalPaperProfileId } from "../../types/settings";

const RECEIPT_PAGE_STYLE_ID = "qpos-receipt-page-style";
const RECEIPT_WIDTH_PROPERTY = "--receipt-paper-width";

export type ReceiptPrinterConfig = {
  paperProfile: ThermalPaperProfileId;
  autoCut: boolean;
};

export function beginBrowserReceiptPrint(config: ReceiptPrinterConfig) {
  const width = `${getThermalPaperProfile(config.paperProfile).widthMm}mm`;
  document.documentElement.style.setProperty(RECEIPT_WIDTH_PROPERTY, width);
  document.body.style.setProperty(RECEIPT_WIDTH_PROPERTY, width);
  document.body.classList.add("receipt-printing");

  const pageStyle = document.createElement("style");
  pageStyle.id = RECEIPT_PAGE_STYLE_ID;
  pageStyle.textContent = `@page { size: ${width} auto; margin: 0; }`;
  document.getElementById(RECEIPT_PAGE_STYLE_ID)?.remove();
  document.head.appendChild(pageStyle);
}

export function completeBrowserReceiptPrint(config: ReceiptPrinterConfig) {
  if (config.autoCut) {
    // Browser printing exposes no raw cut command. Ending window.print normally
    // lets a compatible thermal driver cut at end-of-job without an extra page.
    // TODO(desktop): send the ESC/POS GS V command directly via the desktop print adapter.
  }

  document.body.classList.remove("receipt-printing");
  document.body.style.removeProperty(RECEIPT_WIDTH_PROPERTY);
  document.documentElement.style.removeProperty(RECEIPT_WIDTH_PROPERTY);
  document.getElementById(RECEIPT_PAGE_STYLE_ID)?.remove();
}
