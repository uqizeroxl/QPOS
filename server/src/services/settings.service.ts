import bcrypt from "bcryptjs";
import crypto from "node:crypto";
import type { PrismaClient } from "../generated/prisma/client";
import { InvitationStatus, StoreRole } from "../generated/master-prisma/client";
import { appConfig } from "../config/app.config";
import { masterPrisma } from "../utils/master-prisma";
import { stripHtml } from "../utils/escape";

const DEFAULT_RECEIPT_FOOTER = "Terima kasih";
const DEFAULT_STORE_NAME = "Toko Saya";
const MAX_RECEIPT_FOOTER_LENGTH = 250;
const MAX_RECEIPT_FOOTER_LINES = 5;
const THERMAL_PAPER_WIDTHS = [58, 80] as const;
const THERMAL_PAPER_PROFILES = {
  "57x30": 57,
  "58x30": 58,
  "58x40": 58,
  "58x50": 58,
  "80x50": 80,
  "80x80": 80
} as const;
const PRINTER_BACKENDS = ["BROWSER", "QZ_TRAY", "NODE_THERMAL_PRINTER"] as const;
const THERMAL_PRINTER_TYPES = ["epson", "star", "tanca", "daruma", "brother", "custom"] as const;

export class ReceiptFooterValidationError extends Error {}

const normalizeThermalPaperWidth = (value: unknown) => {
  if (typeof value !== "number" || !THERMAL_PAPER_WIDTHS.includes(value as 58 | 80)) {
    throw new ReceiptFooterValidationError("Ukuran kertas harus 58 mm atau 80 mm.");
  }
  return value;
};

const normalizeThermalPaperProfile = (value: unknown) => {
  if (
    typeof value !== "string" ||
    !Object.prototype.hasOwnProperty.call(THERMAL_PAPER_PROFILES, value)
  ) {
    throw new ReceiptFooterValidationError("Profil ukuran kertas tidak valid.");
  }
  return value as keyof typeof THERMAL_PAPER_PROFILES;
};

const migrateLegacyThermalPaperWidth = (value: unknown) =>
  normalizeThermalPaperWidth(value) === 58 ? "58x30" as const : "80x80" as const;

const normalizeReceiptAutoCut = (value: unknown) => {
  if (typeof value !== "boolean") {
    throw new ReceiptFooterValidationError("Auto Cut harus berupa ON atau OFF.");
  }
  return value;
};

const normalizePrinterBackend = (value: unknown) => {
  if (
    typeof value !== "string" ||
    !PRINTER_BACKENDS.includes(value as (typeof PRINTER_BACKENDS)[number])
  ) {
    throw new ReceiptFooterValidationError("Backend printer tidak valid.");
  }
  return value;
};

const normalizeSelectedPrinterName = (value: unknown) => {
  if (value === undefined) return undefined;
  if (typeof value !== "string") {
    throw new ReceiptFooterValidationError("Nama printer harus berupa teks.");
  }
  const name = stripHtml(value).trim();
  if (name.length > 255) {
    throw new ReceiptFooterValidationError("Nama printer maksimal 255 karakter.");
  }
  return name;
};

const normalizeThermalPrinterType = (value: unknown) => {
  if (value === undefined) return undefined;
  if (typeof value !== "string" || !THERMAL_PRINTER_TYPES.includes(value as typeof THERMAL_PRINTER_TYPES[number])) {
    throw new ReceiptFooterValidationError("Tipe printer thermal tidak valid.");
  }
  return value as typeof THERMAL_PRINTER_TYPES[number];
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

const normalizeStoreName = (value: unknown) => {
  if (typeof value !== "string") {
    throw new ReceiptFooterValidationError("Nama toko harus berupa teks.");
  }

  const storeName = stripHtml(value).trim();

  if (!storeName) {
    return DEFAULT_STORE_NAME;
  }

  if (storeName.length > 150) {
    throw new ReceiptFooterValidationError("Nama toko maksimal 150 karakter.");
  }

  return storeName;
};

const normalizePhone = (value: unknown) => {
  if (value === undefined) {
    return undefined;
  }

  if (typeof value !== "string") {
    throw new ReceiptFooterValidationError("Nomor telepon harus berupa teks.");
  }

  const phone = stripHtml(value).trim();
  if (phone.length > 30) {
    throw new ReceiptFooterValidationError("Nomor telepon maksimal 30 karakter.");
  }

  return phone;
};

const normalizeAddress = (value: unknown) => {
  if (value === undefined) {
    return undefined;
  }

  if (typeof value !== "string") {
    throw new ReceiptFooterValidationError("Alamat harus berupa teks.");
  }

  return stripHtml(value).replace(/\r\n?/g, "\n").trim();
};

export const getSettings = async (prisma: PrismaClient) => {
  const settings = await prisma.settings.upsert({
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
      printerBackend: true,
      selectedPrinterName: true,
      thermalPrinterType: true
    }
  });

  return settings;
};

export const updateSettings = async (
  prisma: PrismaClient,
  storeNameValue: unknown,
  receiptFooterValue: unknown,
  phoneValue: unknown,
  addressValue: unknown,
  thermalPaperProfileValue: unknown,
  thermalPaperWidthValue: unknown,
  receiptAutoCutValue: unknown,
  printerBackendValue: unknown,
  selectedPrinterNameValue: unknown,
  thermalPrinterTypeValue: unknown
) => {
  const storeName = normalizeStoreName(storeNameValue);
  const phone = normalizePhone(phoneValue);
  const address = normalizeAddress(addressValue);
  const receiptFooter = normalizeReceiptFooter(receiptFooterValue);
  const thermalPaperProfile = thermalPaperProfileValue === undefined
    ? thermalPaperWidthValue === undefined
      ? undefined
      : migrateLegacyThermalPaperWidth(thermalPaperWidthValue)
    : normalizeThermalPaperProfile(thermalPaperProfileValue);
  const thermalPaperWidth = thermalPaperProfile === undefined
    ? undefined
    : THERMAL_PAPER_PROFILES[thermalPaperProfile];
  const receiptAutoCut = receiptAutoCutValue === undefined
    ? undefined
    : normalizeReceiptAutoCut(receiptAutoCutValue);
  const printerBackend = printerBackendValue === undefined
    ? undefined
    : normalizePrinterBackend(printerBackendValue);
  const selectedPrinterName = normalizeSelectedPrinterName(
    selectedPrinterNameValue
  );
  const thermalPrinterType = normalizeThermalPrinterType(thermalPrinterTypeValue);

  return prisma.settings.upsert({
    where: { key: "default" },
    create: {
      key: "default",
      storeName,
      ...(phone === undefined ? {} : { phone }),
      ...(address === undefined ? {} : { address }),
      receiptFooter,
      ...(thermalPaperWidth === undefined ? {} : { thermalPaperWidth }),
      ...(thermalPaperProfile === undefined ? {} : { thermalPaperProfile }),
      ...(receiptAutoCut === undefined ? {} : { receiptAutoCut }),
      ...(printerBackend === undefined ? {} : { printerBackend }),
      ...(selectedPrinterName === undefined ? {} : { selectedPrinterName }),
      ...(thermalPrinterType === undefined ? {} : { thermalPrinterType })
    },
    update: {
      storeName,
      ...(phone === undefined ? {} : { phone }),
      ...(address === undefined ? {} : { address }),
      receiptFooter,
      ...(thermalPaperWidth === undefined ? {} : { thermalPaperWidth }),
      ...(thermalPaperProfile === undefined ? {} : { thermalPaperProfile }),
      ...(receiptAutoCut === undefined ? {} : { receiptAutoCut }),
      ...(printerBackend === undefined ? {} : { printerBackend }),
      ...(selectedPrinterName === undefined ? {} : { selectedPrinterName }),
      ...(thermalPrinterType === undefined ? {} : { thermalPrinterType })
    },
    select: {
      storeName: true,
      phone: true,
      address: true,
      receiptFooter: true,
      thermalPaperProfile: true,
      receiptAutoCut: true,
      printerBackend: true,
      selectedPrinterName: true,
      thermalPrinterType: true
    }
  });
};

export const updateReceiptFooter = async (
  prisma: PrismaClient,
  value: unknown,
  thermalPaperProfileValue: unknown,
  thermalPaperWidthValue: unknown,
  receiptAutoCutValue: unknown,
  printerBackendValue: unknown,
  selectedPrinterNameValue: unknown,
  thermalPrinterTypeValue: unknown
) => {
  const receiptFooter = normalizeReceiptFooter(value);
  const thermalPaperProfile = thermalPaperProfileValue === undefined
    ? thermalPaperWidthValue === undefined
      ? undefined
      : migrateLegacyThermalPaperWidth(thermalPaperWidthValue)
    : normalizeThermalPaperProfile(thermalPaperProfileValue);
  const thermalPaperWidth = thermalPaperProfile === undefined
    ? undefined
    : THERMAL_PAPER_PROFILES[thermalPaperProfile];
  const receiptAutoCut = receiptAutoCutValue === undefined
    ? undefined
    : normalizeReceiptAutoCut(receiptAutoCutValue);
  const printerBackend = printerBackendValue === undefined
    ? undefined
    : normalizePrinterBackend(printerBackendValue);
  const selectedPrinterName = normalizeSelectedPrinterName(
    selectedPrinterNameValue
  );
  const thermalPrinterType = normalizeThermalPrinterType(thermalPrinterTypeValue);

  return prisma.settings.upsert({
    where: { key: "default" },
    create: {
      key: "default",
      receiptFooter,
      ...(thermalPaperWidth === undefined ? {} : { thermalPaperWidth }),
      ...(thermalPaperProfile === undefined ? {} : { thermalPaperProfile }),
      ...(receiptAutoCut === undefined ? {} : { receiptAutoCut }),
      ...(printerBackend === undefined ? {} : { printerBackend }),
      ...(selectedPrinterName === undefined ? {} : { selectedPrinterName }),
      ...(thermalPrinterType === undefined ? {} : { thermalPrinterType })
    },
    update: {
      receiptFooter,
      ...(thermalPaperWidth === undefined ? {} : { thermalPaperWidth }),
      ...(thermalPaperProfile === undefined ? {} : { thermalPaperProfile }),
      ...(receiptAutoCut === undefined ? {} : { receiptAutoCut }),
      ...(printerBackend === undefined ? {} : { printerBackend }),
      ...(selectedPrinterName === undefined ? {} : { selectedPrinterName }),
      ...(thermalPrinterType === undefined ? {} : { thermalPrinterType })
    },
    select: {
      receiptFooter: true,
      thermalPaperProfile: true,
      receiptAutoCut: true,
      printerBackend: true,
      selectedPrinterName: true,
      thermalPrinterType: true
    }
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
