import type { PrismaClient } from "../generated/prisma/client";
import { stripHtml } from "../utils/escape";

const DEFAULT_RECEIPT_FOOTER = "Terima kasih";
const MAX_RECEIPT_FOOTER_LENGTH = 250;
const MAX_RECEIPT_FOOTER_LINES = 5;

export class ReceiptFooterValidationError extends Error {}

const normalizeReceiptFooter = (value: unknown) => {
  if (typeof value !== "string") {
    throw new ReceiptFooterValidationError("Footer struk harus berupa teks.");
  }

  const footer = stripHtml(value).replace(/\r\n?/g, "\n").trim();

  if (footer.length > MAX_RECEIPT_FOOTER_LENGTH) {
    throw new ReceiptFooterValidationError(
      `Footer struk maksimal ${MAX_RECEIPT_FOOTER_LENGTH} karakter.`
    );
  }

  if (footer.split("\n").length > MAX_RECEIPT_FOOTER_LINES) {
    throw new ReceiptFooterValidationError(
      `Footer struk maksimal ${MAX_RECEIPT_FOOTER_LINES} baris.`
    );
  }

  return footer || DEFAULT_RECEIPT_FOOTER;
};

export const getReceiptFooter = async (prisma: PrismaClient) => {
  const settings = await prisma.settings.upsert({
    where: { key: "default" },
    create: { key: "default" },
    update: {},
    select: { receiptFooter: true }
  });

  return settings;
};

export const updateReceiptFooter = async (
  prisma: PrismaClient,
  value: unknown
) => {
  const receiptFooter = normalizeReceiptFooter(value);

  return prisma.settings.upsert({
    where: { key: "default" },
    create: { key: "default", receiptFooter },
    update: { receiptFooter },
    select: { receiptFooter: true }
  });
};

export type ProductDatasetResetResult = {
  stockHistories: number;
  products: number;
  categories: number;
  suppliers: number;
};

export const resetProductDataset = async (
  prisma: PrismaClient
): Promise<ProductDatasetResetResult> =>
  prisma.$transaction(async (tx) => {
    const stockHistories = await tx.stockHistory.deleteMany();
    const products = await tx.product.deleteMany();
    const categories = await tx.category.deleteMany();
    const suppliers = await tx.supplier.deleteMany();

    return {
      stockHistories: stockHistories.count,
      products: products.count,
      categories: categories.count,
      suppliers: suppliers.count
    };
  });
