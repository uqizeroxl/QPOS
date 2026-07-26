import type { SalesTransaction } from "../types/cashier";
import { formatRupiah } from "./currency";

type SalesReportPdfPayload = {
  transactions: SalesTransaction[];
  startDate: Date;
  endDate: Date;
  storeName: string;
};

const pageWidth = 595;
const pageHeight = 842;
const margin = 40;
const rowHeight = 18;

function escapePdfText(value: string) {
  return value.replace(/\\/g, "\\\\").replace(/\(/g, "\\(").replace(/\)/g, "\\)");
}

function getTextWidth(value: string, fontSize: number) {
  return value.length * fontSize * 0.52;
}

function truncateText(value: string, maxWidth: number, fontSize: number) {
  const maxLength = Math.max(Math.floor(maxWidth / (fontSize * 0.52)), 1);

  if (value.length <= maxLength) {
    return value;
  }

  return `${value.slice(0, Math.max(maxLength - 3, 1))}...`;
}

function drawText(
  value: string,
  x: number,
  y: number,
  fontSize = 10,
  align: "left" | "right" = "left",
) {
  const safeValue = escapePdfText(value);
  const nextX =
    align === "right" ? x - getTextWidth(value, fontSize) : x;

  return `BT /F1 ${fontSize} Tf ${nextX.toFixed(2)} ${y.toFixed(
    2,
  )} Td (${safeValue}) Tj ET\n`;
}

function drawLine(x1: number, y1: number, x2: number, y2: number) {
  return `${x1.toFixed(2)} ${y1.toFixed(2)} m ${x2.toFixed(2)} ${y2.toFixed(
    2,
  )} l S\n`;
}

function formatDate(value: Date) {
  return new Intl.DateTimeFormat("id-ID", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(value);
}

function formatTransactionDate(value: string) {
  return new Intl.DateTimeFormat("id-ID", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}

function createSummary(transactions: SalesTransaction[]) {
  return transactions.reduce(
    (summary, transaction) => ({
      totalTransactions: summary.totalTransactions + 1,
      omzet: summary.omzet + transaction.subtotal,
      totalDiscount: summary.totalDiscount + transaction.discountAmount,
      netIncome: summary.netIncome + transaction.grandTotal,
    }),
    {
      totalTransactions: 0,
      omzet: 0,
      totalDiscount: 0,
      netIncome: 0,
    },
  );
}

function drawTableHeader(y: number) {
  let content = drawLine(margin, y + 8, pageWidth - margin, y + 8);

  content += drawText("No", margin, y, 9);
  content += drawText("Tanggal", 70, y, 9);
  content += drawText("Nomor Transaksi", 160, y, 9);
  content += drawText("Total", 365, y, 9);
  content += drawText("Kasir", 445, y, 9);
  content += drawLine(margin, y - 5, pageWidth - margin, y - 5);

  return content;
}

function createReportPages(payload: SalesReportPdfPayload) {
  const summary = createSummary(payload.transactions);
  const sortedTransactions = [...payload.transactions].sort(
    (firstTransaction, secondTransaction) =>
      new Date(firstTransaction.createdAt).getTime() -
      new Date(secondTransaction.createdAt).getTime(),
  );
  const pages: string[] = [];
  let content = "";
  let y = pageHeight - margin;

  const addPage = () => {
    if (content) {
      pages.push(content);
    }

    content = "";
    y = pageHeight - margin;
  };

  content += drawText(payload.storeName, margin, y, 18);
  y -= 22;
  content += drawText("Laporan Penjualan", margin, y, 16);
  y -= 18;
  content += drawText(
    `Periode: ${formatDate(payload.startDate)} - ${formatDate(payload.endDate)}`,
    margin,
    y,
    10,
  );
  y -= 24;
  content += drawLine(margin, y, pageWidth - margin, y);
  y -= 20;

  content += drawText("Ringkasan", margin, y, 12);
  y -= 18;
  content += drawText(
    `Total Transaksi: ${summary.totalTransactions}`,
    margin,
    y,
    10,
  );
  content += drawText(
    `Omzet: ${formatRupiah(summary.omzet, { prefix: true })}`,
    300,
    y,
    10,
  );
  y -= 16;
  content += drawText(
    `Total Diskon: ${formatRupiah(summary.totalDiscount, { prefix: true })}`,
    margin,
    y,
    10,
  );
  content += drawText(
    `Pendapatan Bersih: ${formatRupiah(summary.netIncome, { prefix: true })}`,
    300,
    y,
    10,
  );
  y -= 28;

  if (sortedTransactions.length === 0) {
    content += drawText("Belum ada transaksi pada periode ini.", margin, y, 11);
    pages.push(content);
    return pages;
  }

  content += drawText("Tabel Transaksi", margin, y, 12);
  y -= 18;
  content += drawTableHeader(y);
  y -= rowHeight;

  sortedTransactions.forEach((transaction, index) => {
    if (y < margin + 30) {
      addPage();
      content += drawText(payload.storeName, margin, y, 14);
      y -= 24;
      content += drawTableHeader(y);
      y -= rowHeight;
    }

    content += drawText((index + 1).toString(), margin, y, 9);
    content += drawText(
      truncateText(formatTransactionDate(transaction.createdAt), 78, 9),
      70,
      y,
      9,
    );
    content += drawText(
      truncateText(transaction.transactionNumber, 190, 9),
      160,
      y,
      9,
    );
    content += drawText(
      formatRupiah(transaction.grandTotal, { prefix: true }),
      430,
      y,
      9,
      "right",
    );
    content += drawText(
      truncateText(transaction.cashierName ?? "-", 105, 9),
      445,
      y,
      9,
    );
    y -= rowHeight;
  });

  pages.push(content);
  return pages;
}

function buildPdf(pages: string[]) {
  const objects: string[] = [];
  const pageObjectIds = pages.map((_, index) => 4 + index * 2);
  const contentObjectIds = pages.map((_, index) => 5 + index * 2);

  objects[1] = "<< /Type /Catalog /Pages 2 0 R >>";
  objects[2] = `<< /Type /Pages /Kids [${pageObjectIds
    .map((id) => `${id} 0 R`)
    .join(" ")}] /Count ${pages.length} >>`;
  objects[3] = "<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>";

  pages.forEach((pageContent, index) => {
    const pageObjectId = pageObjectIds[index];
    const contentObjectId = contentObjectIds[index];

    objects[pageObjectId] = `<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${pageWidth} ${pageHeight}] /Resources << /Font << /F1 3 0 R >> >> /Contents ${contentObjectId} 0 R >>`;
    objects[contentObjectId] = `<< /Length ${pageContent.length} >>\nstream\n${pageContent}endstream`;
  });

  let pdf = "%PDF-1.4\n";
  const offsets = [0];

  for (let objectId = 1; objectId < objects.length; objectId += 1) {
    offsets[objectId] = pdf.length;
    pdf += `${objectId} 0 obj\n${objects[objectId]}\nendobj\n`;
  }

  const xrefOffset = pdf.length;
  pdf += `xref\n0 ${objects.length}\n`;
  pdf += "0000000000 65535 f \n";

  for (let objectId = 1; objectId < objects.length; objectId += 1) {
    pdf += `${offsets[objectId].toString().padStart(10, "0")} 00000 n \n`;
  }

  pdf += `trailer\n<< /Size ${objects.length} /Root 1 0 R >>\nstartxref\n${xrefOffset}\n%%EOF`;

  return new Blob([pdf], { type: "application/pdf" });
}

export function createSalesReportPdf(payload: SalesReportPdfPayload) {
  return buildPdf(createReportPages(payload));
}

export function downloadPdf(blob: Blob, fileName: string) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");

  link.href = url;
  link.download = fileName;
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 0);
}
