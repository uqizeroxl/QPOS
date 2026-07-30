import bcrypt from "bcryptjs";
import crypto from "node:crypto";
import type { PrismaClient } from "../generated/prisma/client";
import { InvitationStatus, StoreRole } from "../generated/master-prisma/client";
import { appConfig } from "../config/app.config";
import { masterPrisma } from "../utils/master-prisma";
import { stripHtml } from "../utils/escape";

const DEFAULT_RECEIPT_FOOTER = "Terima kasih";
const MAX_RECEIPT_FOOTER_LENGTH = 250;
const MAX_RECEIPT_FOOTER_LINES = 5;
const THERMAL_PAPER_WIDTHS = [58, 80] as const;

export class ReceiptFooterValidationError extends Error {}

const normalizeThermalPaperWidth = (value: unknown) => {
  if (typeof value !== "number" || !THERMAL_PAPER_WIDTHS.includes(value as 58 | 80)) {
    throw new ReceiptFooterValidationError("Ukuran kertas harus 58 mm atau 80 mm.");
  }
  return value;
};

const normalizeReceiptAutoCut = (value: unknown) => {
  if (typeof value !== "boolean") {
    throw new ReceiptFooterValidationError("Auto Cut harus berupa ON atau OFF.");
  }
  return value;
};

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
    select: { receiptFooter: true, thermalPaperWidth: true, receiptAutoCut: true }
  });

  return settings;
};

export const updateReceiptFooter = async (
  prisma: PrismaClient,
  value: unknown,
  thermalPaperWidthValue: unknown,
  receiptAutoCutValue: unknown
) => {
  const receiptFooter = normalizeReceiptFooter(value);
  const thermalPaperWidth = thermalPaperWidthValue === undefined
    ? undefined
    : normalizeThermalPaperWidth(thermalPaperWidthValue);
  const receiptAutoCut = receiptAutoCutValue === undefined
    ? undefined
    : normalizeReceiptAutoCut(receiptAutoCutValue);

  return prisma.settings.upsert({
    where: { key: "default" },
    create: {
      key: "default",
      receiptFooter,
      ...(thermalPaperWidth === undefined ? {} : { thermalPaperWidth }),
      ...(receiptAutoCut === undefined ? {} : { receiptAutoCut })
    },
    update: {
      receiptFooter,
      ...(thermalPaperWidth === undefined ? {} : { thermalPaperWidth }),
      ...(receiptAutoCut === undefined ? {} : { receiptAutoCut })
    },
    select: { receiptFooter: true, thermalPaperWidth: true, receiptAutoCut: true }
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

export class ChangeOwnerValidationError extends Error {
  constructor(message: string) {
    super(message);
  }
}

export const changeStoreOwner = async (
  prisma: PrismaClient,
  storeId: string,
  currentOwnerAccountId: string,
  newOwnerUsername: string,
  password: string
) => {
  const account = await masterPrisma.account.findUnique({
    where: { id: currentOwnerAccountId },
    select: { passwordHash: true }
  });

  if (!account) {
    throw new ChangeOwnerValidationError("Akun tidak ditemukan.");
  }

  const isPasswordValid = await bcrypt.compare(password, account.passwordHash);
  if (!isPasswordValid) {
    throw new ChangeOwnerValidationError("Password saat ini salah.");
  }

  const targetAccount = await masterPrisma.account.findUnique({
    where: { username: newOwnerUsername },
    select: { id: true, name: true }
  });

  if (!targetAccount) {
    throw new ChangeOwnerValidationError(
      `Akun dengan username "${newOwnerUsername}" tidak ditemukan.`
    );
  }

  const targetMembership = await masterPrisma.storeMember.findUnique({
    where: {
      accountId_storeId: {
        accountId: targetAccount.id,
        storeId
      }
    },
    select: { id: true, role: true }
  });

  if (!targetMembership) {
    throw new ChangeOwnerValidationError(
      `Akun "${newOwnerUsername}" bukan anggota toko ini.`
    );
  }

  if (targetAccount.id === currentOwnerAccountId) {
    throw new ChangeOwnerValidationError(
      "Anda sudah menjadi pemilik toko ini."
    );
  }

  await masterPrisma.$transaction([
    masterPrisma.storeMember.update({
      where: { id: targetMembership.id },
      data: { role: StoreRole.OWNER }
    }),
    masterPrisma.storeMember.update({
      where: { accountId_storeId: { accountId: currentOwnerAccountId, storeId } },
      data: { role: StoreRole.MANAGER }
    })
  ]);

  return { newOwnerName: targetAccount.name };
};

export const createOwnerInvitation = async (
  storeId: string,
  email: string,
  origin: string
) => {
  const existingOwner = await masterPrisma.storeMember.findFirst({
    where: { storeId, role: StoreRole.OWNER },
    select: { account: { select: { id: true } } }
  });

  if (!existingOwner) {
    throw new ChangeOwnerValidationError("Pemilik toko tidak ditemukan.");
  }

  const token = crypto.randomBytes(32).toString("hex");
  const expiresAt = new Date(
    Date.now() + appConfig.invitationExpiryHours * 60 * 60 * 1000
  );

  await masterPrisma.storeInvitation.create({
    data: {
      storeId,
      email,
      token,
      expiresAt
    }
  });

  const inviteLink = `${origin}/accept-ownership?token=${token}`;

  return { inviteLink, email, expiresAt };
};

export const deleteStore = async (
  prisma: PrismaClient,
  storeId: string
) => {
  await prisma.$transaction(async (tx) => {
    await tx.stockHistory.deleteMany();
    await tx.transactionItem.deleteMany();
    await tx.transaction.deleteMany();
    await tx.purchaseOrder.deleteMany();
    await tx.product.deleteMany();
    await tx.category.deleteMany();
    await tx.supplier.deleteMany();
    await tx.activityLog.deleteMany();
    await tx.notification.deleteMany();
    await tx.settings.deleteMany();
    await tx.user.deleteMany();
  });

  await masterPrisma.store.delete({
    where: { id: storeId }
  });
};
