import type { NextFunction, Request, Response } from "express";

import {
  printReceiptWithThermalPrinter,
  testThermalPrinterConnection,
} from "../services/thermal-printer.service";

type PrintReceiptBody = {
  transactionNumber?: string;
  createdAt?: string;
  items?: Array<{
    name?: string;
    quantity?: number;
    price?: number;
    subtotal?: number;
  }>;
  subtotal?: number;
  discountPercent?: number;
  discountAmount?: number;
  grandTotal?: number;
  paidAmount?: number;
  change?: number;
  cashierName?: string;
};

export const printReceipt = async (
  req: Request<unknown, unknown, PrintReceiptBody>,
  res: Response,
  next: NextFunction
) => {
  try {
    const { transactionNumber, createdAt, items } = req.body;

    if (!transactionNumber || !createdAt || !Array.isArray(items) || items.length === 0) {
      res.status(400).json({
        success: false,
        message: "Data struk tidak lengkap."
      });
      return;
    }

    const result = await printReceiptWithThermalPrinter(req.tenant.prisma, {
      transactionNumber,
      createdAt,
      items: items.map((item) => ({
        name: String(item.name ?? ""),
        quantity: Number(item.quantity ?? 0),
        price: Number(item.price ?? 0),
        subtotal: Number(item.subtotal ?? 0)
      })),
      subtotal: Number(req.body.subtotal ?? 0),
      discountPercent: Number(req.body.discountPercent ?? 0),
      discountAmount: Number(req.body.discountAmount ?? 0),
      grandTotal: Number(req.body.grandTotal ?? 0),
      paidAmount: Number(req.body.paidAmount ?? 0),
      change: Number(req.body.change ?? 0),
      cashierName: typeof req.body.cashierName === "string" ? req.body.cashierName : undefined
    });

    res.status(200).json({
      success: true,
      message: "Struk berhasil dicetak.",
      data: result
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Gagal mencetak struk.";
    res.status(503).json({
      success: false,
      message
    });
  }
};

export const testConnection = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const result = await testThermalPrinterConnection(req.tenant.prisma);
    res.status(200).json({
      success: true,
      message: "Printer thermal terhubung.",
      data: result
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Gagal menghubungkan printer thermal.";
    res.status(503).json({
      success: false,
      message
    });
  }
};
