import { CharacterSet, PrinterTypes, ThermalPrinter } from "node-thermal-printer";

import type { PrismaClient } from "../generated/prisma/client";

type ReceiptTransactionItem = {
  name: string;
  quantity: number;
  price: number;
  subtotal: number;
};

type ReceiptTransactionPayload = {
  transactionNumber: string;
  createdAt: string;
  items: ReceiptTransactionItem[];
  subtotal: number;
  discountPercent: number;
  discountAmount: number;
  grandTotal: number;
  paidAmount: number;
  change: number;
  cashierName?: string;
};

type ThermalPrinterSettings = {
  storeName: string;
  phone: string;
  address: string;
  receiptFooter: string;
  thermalPaperProfile: string;
  receiptAutoCut: boolean;
  selectedPrinterName: string;
  thermalPrinterType: string;
};

const PAPER_WIDTH_TO_CHARACTERS: Record<number, number> = {
  57: 32,
  58: 32,
  80: 48,
};

function getPrinterWidth(profile: string) {
  return profile.startsWith("58") || profile.startsWith("57")
    ? PAPER_WIDTH_TO_CHARACTERS[58]
    : PAPER_WIDTH_TO_CHARACTERS[80];
}

function resolvePrinterInterface(selectedPrinterName: string) {
  const printer = selectedPrinterName.trim();
  if (!printer) {
    throw new Error("Interface printer thermal belum diatur.");
  }
  return printer.startsWith("tcp://") || printer.startsWith("printer:")
    ? printer
    : `printer:${printer}`;
}

function formatCurrency(value: number) {
  return new Intl.NumberFormat("id-ID", {
    maximumFractionDigits: 0,
  }).format(value);
}

function drawLine(width: number, character = "-") {
  return character.repeat(width);
}

function resolvePrinterType(value: string) {
  switch (value) {
    case "star":
      return PrinterTypes.STAR;
    case "tanca":
      return PrinterTypes.TANCA;
    case "daruma":
      return PrinterTypes.DARUMA;
    case "brother":
      return PrinterTypes.BROTHER;
    case "custom":
      return PrinterTypes.CUSTOM;
    case "epson":
    default:
      return PrinterTypes.EPSON;
  }
}

function formatReceiptDate(value: string) {
  return new Intl.DateTimeFormat("id-ID", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

async function getThermalPrinterSettings(prisma: PrismaClient) {
  return prisma.settings.upsert({
    where: { key: "default" },
    create: { key: "default" },
    update: {},
    select: {
      storeName: true,
      phone: true,
      address: true,
      receiptFooter: true,
      thermalPaperProfile: true,
      receiptAutoCut: true,
      selectedPrinterName: true,
      thermalPrinterType: true,
    },
  }) as unknown as ThermalPrinterSettings;
}

function createThermalPrinter(settings: ThermalPrinterSettings) {
  const printerWidth = getPrinterWidth(settings.thermalPaperProfile);
  return {
    printerWidth,
    printer: new ThermalPrinter({
      type: resolvePrinterType(settings.thermalPrinterType),
      width: printerWidth,
      interface: resolvePrinterInterface(settings.selectedPrinterName),
      characterSet: CharacterSet.WPC1252,
      removeSpecialCharacters: false,
      lineCharacter: "-",
    }),
  };
}

export async function testThermalPrinterConnection(prisma: PrismaClient) {
  const settings = await getThermalPrinterSettings(prisma);
  const { printer, printerWidth } = createThermalPrinter(settings);
  const isConnected = await printer.isPrinterConnected();
  if (!isConnected) {
    throw new Error("Printer thermal tidak terhubung.");
  }

  return {
    printer: settings.selectedPrinterName,
    printerType: settings.thermalPrinterType,
    width: printerWidth,
  };
}

export async function printReceiptWithThermalPrinter(
  prisma: PrismaClient,
  transaction: ReceiptTransactionPayload,
) {
  const settings = await getThermalPrinterSettings(prisma);
  const { printer, printerWidth } = createThermalPrinter(settings);

  printer.alignCenter();
  printer.println(settings.storeName);
  if (settings.address) printer.println(settings.address);
  if (settings.phone) printer.println(settings.phone);
  printer.drawLine();
  printer.alignLeft();
  printer.println(`No : ${transaction.transactionNumber}`);
  printer.println(`Tanggal : ${formatReceiptDate(transaction.createdAt)}`);
  printer.drawLine();

  for (const item of transaction.items) {
    printer.println(item.name);
    printer.println(
      `${item.quantity} x ${formatCurrency(item.price)} = ${formatCurrency(item.subtotal)}`
    );
  }

  printer.drawLine();
  printer.tableCustom([
    { text: "Subtotal", align: "LEFT", width: 0.6 },
    { text: formatCurrency(transaction.subtotal), align: "RIGHT", width: 0.4 },
  ]);
  printer.tableCustom([
    { text: `Diskon (${transaction.discountPercent}%)`, align: "LEFT", width: 0.6 },
    { text: `-${formatCurrency(transaction.discountAmount)}`, align: "RIGHT", width: 0.4 },
  ]);
  printer.tableCustom([
    { text: "Grand Total", align: "LEFT", width: 0.6, bold: true },
    { text: formatCurrency(transaction.grandTotal), align: "RIGHT", width: 0.4, bold: true },
  ]);
  printer.tableCustom([
    { text: "Bayar", align: "LEFT", width: 0.6 },
    { text: formatCurrency(transaction.paidAmount), align: "RIGHT", width: 0.4 },
  ]);
  printer.tableCustom([
    { text: "Kembali", align: "LEFT", width: 0.6 },
    { text: formatCurrency(transaction.change), align: "RIGHT", width: 0.4 },
  ]);
  printer.drawLine();
  printer.alignCenter();
  printer.println(settings.receiptFooter || "Terima kasih");
  if (settings.receiptAutoCut) {
    printer.cut();
  }

  const isConnected = await printer.isPrinterConnected();
  if (!isConnected) {
    throw new Error("Printer thermal tidak terhubung.");
  }

  await printer.execute();

  return {
    printer: settings.selectedPrinterName,
    printerType: settings.thermalPrinterType,
    width: printerWidth,
    lineCount: transaction.items.length,
    lineCharacter: drawLine(printerWidth),
  };
}
