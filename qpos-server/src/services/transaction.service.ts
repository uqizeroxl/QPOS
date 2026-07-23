import { createHash } from "node:crypto";

import {
  ActivityType,
  Prisma,
  PrismaClient,
  RecordStatus,
  StockAdjustmentType,
  StockReferenceType
} from "../generated/prisma/client";

export type CreateTransactionItemInput = {
  productId?: string | null;
  barcode: string;
  name: string;
  price: number;
  quantity: number;
  subtotal: number;
};

export type CreateTransactionInput = {
  items: CreateTransactionItemInput[];
  subtotal: number;
  discountPercent: number;
  discountAmount: number;
  grandTotal: number;
  paidAmount: number;
  change: number;
  cashierName?: string;
};

export type GetTransactionsInput = {
  page: number;
  limit: number;
  search?: string;
  startDate?: Date;
  endDate?: Date;
  sort: "latest" | "oldest";
};

export class InvalidTransactionDataError extends Error {
  constructor(message = "Invalid transaction data") {
    super(message);
  }
}

export class InsufficientStockError extends Error {
  constructor(productName: string) {
    super(`Stok ${productName} tidak mencukupi.`);
  }
}

export class TransactionNotFoundError extends Error {
  constructor() {
    super("Transaction not found");
  }
}

export class IdempotencyConflictError extends Error {
  constructor() {
    super("Idempotency-Key has already been used with a different request");
  }
}

const transactionInclude = {
  items: true
} satisfies Prisma.TransactionInclude;

const hashTransactionRequest = (data: CreateTransactionInput) =>
  createHash("sha256").update(JSON.stringify(data)).digest("hex");

const findIdempotentTransaction = async (
  prisma: PrismaClient,
  idempotencyKey: string,
  requestHash: string
) => {
  const existing = await prisma.transaction.findUnique({
    where: { idempotencyKey },
    include: transactionInclude
  });

  if (existing && existing.requestHash !== requestHash) {
    throw new IdempotencyConflictError();
  }

  return existing;
};

const generateInvoiceNumber = () => {
  const now = new Date();
  const datePart = now.toISOString().slice(0, 10).replace(/-/g, "");
  const timePart = now.getTime().toString().slice(-8);

  return `INV-${datePart}-${timePart}`;
};

export const createTransaction = async (
  prisma: PrismaClient,
  data: CreateTransactionInput,
  idempotencyKey?: string
) => {
  if (!data.items.length) {
    throw new InvalidTransactionDataError("Transaction items are required");
  }

  const requestHash = idempotencyKey
    ? hashTransactionRequest(data)
    : undefined;

  if (idempotencyKey && requestHash) {
    const existing = await findIdempotentTransaction(
      prisma,
      idempotencyKey,
      requestHash
    );

    if (existing) {
      return existing;
    }
  }

  return prisma.$transaction(async (tx) => {
    const productIds = data.items
      .map((item) => item.productId)
      .filter((productId): productId is string => Boolean(productId));
    const products = await tx.product.findMany({
      where: {
        id: {
          in: productIds
        },
        status: RecordStatus.ACTIVE
      },
      include: {
        category: {
          select: {
            name: true
          }
        },
        supplier: {
          select: {
            name: true
          }
        }
      }
    });
    const productById = new Map(
      products.map((product) => [product.id, product])
    );
    const stockChanges: Array<{
      productId: string;
      quantity: number;
      previousStock: number;
      currentStock: number;
    }> = [];

    for (const item of data.items) {
      if (!item.productId) {
        continue;
      }

      const product = productById.get(item.productId);

      if (!product) {
        throw new InvalidTransactionDataError(
          `${item.name} tidak tersedia.`
        );
      }

      if (product.stock < item.quantity) {
        throw new InsufficientStockError(product.name);
      }

      const updateResult = await tx.product.updateMany({
        where: {
          id: product.id,
          stock: {
            gte: item.quantity
          }
        },
        data: {
          stock: {
            decrement: item.quantity
          }
        }
      });

      if (updateResult.count !== 1) {
        throw new InsufficientStockError(product.name);
      }

      const previousStock = product.stock;
      const currentStock = previousStock - item.quantity;
      stockChanges.push({
        productId: product.id,
        quantity: item.quantity,
        previousStock,
        currentStock
      });
      product.stock = currentStock;
    }

    let invoiceNumber = generateInvoiceNumber();
    let existingTransaction = await tx.transaction.findUnique({
      where: {
        invoiceNumber
      },
      select: {
        id: true
      }
    });

    while (existingTransaction) {
      invoiceNumber = generateInvoiceNumber();
      existingTransaction = await tx.transaction.findUnique({
        where: {
          invoiceNumber
        },
        select: {
          id: true
        }
      });
    }

    const transaction = await tx.transaction.create({
      data: {
        invoiceNumber,
        idempotencyKey,
        requestHash,
        subtotal: data.subtotal,
        discountPercent: data.discountPercent,
        discountAmount: data.discountAmount,
        grandTotal: data.grandTotal,
        paidAmount: data.paidAmount,
        change: data.change,
        cashierName: data.cashierName,
        items: {
          create: data.items.map((item) => ({
            productId: item.productId,
            productBarcode: item.productId
              ? productById.get(item.productId)?.barcode ?? item.barcode
              : item.barcode,
            productName: item.productId
              ? productById.get(item.productId)?.name ?? item.name
              : item.name,
            categoryName: item.productId
              ? productById.get(item.productId)?.category.name ?? ""
              : "",
            supplierName: item.productId
              ? productById.get(item.productId)?.supplier?.name ?? null
              : null,
            unitPrice: item.productId
              ? productById.get(item.productId)?.sellingPrice ?? item.price
              : item.price,
            quantity: item.quantity,
            subtotal: item.subtotal
          }))
        }
      },
      include: transactionInclude
    });

    if (stockChanges.length) {
      await tx.stockHistory.createMany({
        data: stockChanges.map((change) => ({
          ...change,
          type: StockAdjustmentType.REDUCE,
          referenceType: StockReferenceType.SALE,
          referenceId: invoiceNumber,
          userName: data.cashierName,
          note: `Penjualan ${invoiceNumber}`
        }))
      });
    }

    await tx.activityLog.create({
      data: {
        type: ActivityType.TRANSACTION_SUCCESS,
        title: "Transaksi Berhasil",
        description: `${invoiceNumber} berhasil dibuat.`,
        metadata: {
          transactionId: transaction.id,
          invoiceNumber,
          grandTotal: data.grandTotal,
          itemCount: data.items.reduce(
            (total, item) => total + item.quantity,
            0
          )
        }
      }
    });

    return transaction;
  }).catch(async (error) => {
    if (
      idempotencyKey &&
      requestHash &&
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2002"
    ) {
      const existing = await findIdempotentTransaction(
        prisma,
        idempotencyKey,
        requestHash
      );

      if (existing) {
        return existing;
      }
    }

    if (error instanceof Prisma.PrismaClientValidationError) {
      throw new InvalidTransactionDataError(error.message);
    }

    throw error;
  });
};

export const getTransactions = async (
  prisma: PrismaClient,
  params: GetTransactionsInput
) => {
  const skip = (params.page - 1) * params.limit;
  const where: Prisma.TransactionWhereInput = {
    ...(params.search
      ? {
          invoiceNumber: {
            contains: params.search,
            mode: "insensitive"
          }
        }
      : {}),
    ...(params.startDate || params.endDate
      ? {
          createdAt: {
            ...(params.startDate ? { gte: params.startDate } : {}),
            ...(params.endDate ? { lte: params.endDate } : {})
          }
        }
      : {})
  };

  const [transactions, total] = await prisma.$transaction([
    prisma.transaction.findMany({
      where,
      skip,
      take: params.limit,
      orderBy: {
        createdAt: params.sort === "oldest" ? "asc" : "desc"
      },
      select: {
        id: true,
        invoiceNumber: true,
        cashierName: true,
        subtotal: true,
        discountAmount: true,
        grandTotal: true,
        createdAt: true
      }
    }),
    prisma.transaction.count({ where })
  ]);

  return {
    data: transactions.map((transaction) => ({
      id: transaction.id,
      invoiceNumber: transaction.invoiceNumber,
      customerName: null,
      cashierName: transaction.cashierName,
      paymentMethod: "Cash",
      subtotal: transaction.subtotal,
      tax: 0,
      discount: transaction.discountAmount,
      total: transaction.grandTotal,
      createdAt: transaction.createdAt
    })),
    pagination: {
      page: params.page,
      limit: params.limit,
      total,
      totalPages: Math.max(1, Math.ceil(total / params.limit))
    }
  };
};

export const getTransactionById = async (
  prisma: PrismaClient,
  transactionId: string
) => {
  const transaction = await prisma.transaction.findUnique({
    where: {
      id: transactionId
    },
    include: {
      items: true
    }
  });

  if (!transaction) {
    throw new TransactionNotFoundError();
  }

  return {
    id: transaction.id,
    invoiceNumber: transaction.invoiceNumber,
    customerName: null,
    cashierName: transaction.cashierName,
    paymentMethod: "Cash",
    subtotal: transaction.subtotal,
    tax: 0,
    discount: transaction.discountAmount,
    total: transaction.grandTotal,
    paidAmount: transaction.paidAmount,
    changeAmount: transaction.change,
    createdAt: transaction.createdAt,
    items: transaction.items.map((item) => ({
      quantity: item.quantity,
      price: item.unitPrice,
      subtotal: item.subtotal,
      product: {
        id: item.productId,
        name: item.productName,
        barcode: item.productBarcode,
        categoryName: item.categoryName,
        supplierName: item.supplierName
      }
    }))
  };
};
