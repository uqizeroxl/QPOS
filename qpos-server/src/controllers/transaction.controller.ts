import { NextFunction, Request, Response } from "express";

import * as transactionService from "../services/transaction.service";
import type { AuthenticatedRequest } from "../middleware/auth.middleware";

type CreateTransactionItemRequestBody = {
  productId?: string | null;
  barcode?: string;
  productBarcode?: string;
  name?: string;
  productName?: string;
  price?: number | string;
  unitPrice?: number | string;
  quantity?: number | string;
  subtotal?: number | string;
};

type CreateTransactionRequestBody = {
  items?: CreateTransactionItemRequestBody[];
  subtotal?: number | string;
  discountPercent?: number | string;
  discountAmount?: number | string;
  grandTotal?: number | string;
  total?: number | string;
  paidAmount?: number | string;
  change?: number | string;
  cashierName?: string;
};

type GetTransactionsQuery = {
  page?: string;
  limit?: string;
  search?: string;
  startDate?: string;
  endDate?: string;
  sort?: string;
};

type TransactionParams = {
  id: string;
};

type ResetTransactionHistoryRequestBody = {
  confirmation?: string;
};

const toNumber = (value: number | string | undefined, fallback = 0) => {
  if (value === undefined || value === "") {
    return fallback;
  }

  return Number(value);
};

const parsePositiveInteger = (value: string | undefined, fallback: number) => {
  const parsedValue = Number(value ?? fallback);

  if (!Number.isInteger(parsedValue) || parsedValue < 1) {
    return fallback;
  }

  return Math.min(parsedValue, 100);
};

const parseDate = (value: string | undefined, endOfDay = false) => {
  if (!value) {
    return undefined;
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return undefined;
  }

  if (endOfDay) {
    date.setHours(23, 59, 59, 999);
  }

  return date;
};

export const getTransactions = async (
  req: AuthenticatedRequest & Request<unknown, unknown, unknown, GetTransactionsQuery>,
  res: Response,
  next: NextFunction
) => {
  try {
    const prisma = req.tenant.prisma;
    const page = parsePositiveInteger(req.query.page, 1);
    const limit = parsePositiveInteger(req.query.limit, 10);
    const sort = req.query.sort === "oldest" ? "oldest" : "latest";
    const search = req.query.search?.trim() || undefined;
    const startDate = parseDate(req.query.startDate);
    const endDate = parseDate(req.query.endDate, true);

    const transactions = await transactionService.getTransactions(
      prisma,
      {
        page,
        limit,
        search,
        startDate,
        endDate,
        sort
      }
    );

    res.status(200).json(transactions);
  } catch (error) {
    console.error("Unexpected error while retrieving transactions:", error);
    next(error);
  }
};

export const getTransactionById = async (
  req: AuthenticatedRequest & Request<TransactionParams>,
  res: Response,
  next: NextFunction
) => {
  try {
    const prisma = req.tenant.prisma;
    if (!req.params.id.trim()) {
      res.status(400).json({
        success: false,
        message: "Transaction id is required"
      });
      return;
    }

    const transaction = await transactionService.getTransactionById(
      prisma,
      req.params.id
    );

    res.status(200).json({
      success: true,
      message: "Transaction retrieved successfully",
      data: transaction
    });
  } catch (error) {
    if (error instanceof transactionService.TransactionNotFoundError) {
      res.status(404).json({
        success: false,
        message: "Transaksi tidak ditemukan."
      });
      return;
    }

    console.error("Unexpected error while retrieving transaction:", error);
    next(error);
  }
};

export const createTransaction = async (
  req: AuthenticatedRequest & Request<unknown, unknown, CreateTransactionRequestBody>,
  res: Response,
  next: NextFunction
) => {
  try {
    const prisma = req.tenant.prisma;
    const idempotencyKey = req.get("Idempotency-Key")?.trim();

    if (idempotencyKey && idempotencyKey.length > 191) {
      res.status(400).json({
        success: false,
        message: "Idempotency-Key must not exceed 191 characters"
      });
      return;
    }

    const items = req.body.items ?? [];
    const subtotal = toNumber(req.body.subtotal);
    const discountPercent = toNumber(req.body.discountPercent);
    const discountAmount = toNumber(req.body.discountAmount);
    const grandTotal = toNumber(req.body.grandTotal ?? req.body.total);
    const paidAmount = toNumber(req.body.paidAmount);
    const change = toNumber(req.body.change);
    const cashierName = req.body.cashierName?.trim() || undefined;

    if (!items.length) {
      res.status(400).json({
        success: false,
        message: "Transaction items are required"
      });
      return;
    }

    if (
      [subtotal, discountPercent, discountAmount, grandTotal, paidAmount, change]
        .some((value) => Number.isNaN(value) || value < 0)
    ) {
      res.status(400).json({
        success: false,
        message: "Transaction totals must be greater than or equal to 0"
      });
      return;
    }

    const transactionItems = items.map((item: CreateTransactionItemRequestBody) => {
      const barcode = item.barcode?.trim() ?? item.productBarcode?.trim() ?? "";
      const name = item.name?.trim() ?? item.productName?.trim() ?? "";
      const price = toNumber(item.price ?? item.unitPrice);
      const quantity = toNumber(item.quantity);
      const itemSubtotal = toNumber(item.subtotal);

      if (!barcode || !name) {
        throw new transactionService.InvalidTransactionDataError(
          "Transaction item barcode and name are required"
        );
      }

      if (
        Number.isNaN(price) ||
        Number.isNaN(quantity) ||
        Number.isNaN(itemSubtotal) ||
        price < 0 ||
        quantity <= 0 ||
        itemSubtotal < 0
      ) {
        throw new transactionService.InvalidTransactionDataError(
          "Transaction item values are invalid"
        );
      }

      return {
        productId: item.productId?.trim() || null,
        barcode,
        name,
        price,
        quantity,
        subtotal: itemSubtotal
      };
    });

    const transaction = await transactionService.createTransaction(
      prisma,
      {
        items: transactionItems,
        subtotal,
        discountPercent,
        discountAmount,
        grandTotal,
        paidAmount,
        change,
        cashierName
      },
      idempotencyKey
    );

    res.status(201).json({
      success: true,
      message: "Transaction created successfully",
      data: transaction
    });
  } catch (error) {
    if (error instanceof transactionService.InvalidTransactionDataError) {
      res.status(400).json({
        success: false,
        message: error.message
      });
      return;
    }

    if (error instanceof transactionService.InsufficientStockError) {
      res.status(400).json({
        success: false,
        message: error.message
      });
      return;
    }

    if (error instanceof transactionService.IdempotencyConflictError) {
      res.status(409).json({
        success: false,
        message: error.message
      });
      return;
    }

    console.error("Unexpected error while creating transaction:", error);
    next(error);
  }
};

export const resetTransactionHistory = async (
  req: AuthenticatedRequest & Request<unknown, unknown, ResetTransactionHistoryRequestBody>,
  res: Response,
  next: NextFunction
) => {
  try {
    if (req.body.confirmation !== "RESET") {
      res.status(400).json({
        success: false,
        message: 'Ketik "RESET" untuk mengonfirmasi penghapusan.'
      });
      return;
    }

    const result = await transactionService.resetTransactionHistory(
      req.tenant.prisma,
      req.user.name
    );

    res.status(200).json({
      success: true,
      message: "Seluruh riwayat transaksi berhasil dihapus.",
      data: result
    });
  } catch (error) {
    console.error("[transaction-history-reset] Request failed", {
      storeId: req.tenant?.storeId,
      userId: req.user?.id,
      userName: req.user?.name,
      role: req.user?.role,
      name: error instanceof Error ? error.name : "UnknownError",
      message: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
      error
    });
    next(error);
  }
};
