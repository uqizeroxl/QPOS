import type { NextFunction, Request, Response } from "express";

import { appConfig } from "../config/app.config";
import {
  ChangeOwnerValidationError,
  changeStoreOwner as changeServiceStoreOwner,
  createOwnerInvitation as createServiceOwnerInvitation,
  deleteStore as deleteServiceStore,
  getReceiptFooter as getTenantReceiptFooter,
  ReceiptFooterValidationError,
  resetProductDataset as resetTenantProductDataset,
  updateReceiptFooter as updateTenantReceiptFooter
} from "../services/settings.service";

export const getReceiptFooter = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const settings = await getTenantReceiptFooter(req.tenant.prisma);
    res.status(200).json({ success: true, data: settings });
  } catch (error) {
    next(error);
  }
};

export const updateReceiptFooter = async (
  req: Request<unknown, unknown, {
    receiptFooter?: unknown;
    thermalPaperProfile?: unknown;
    thermalPaperWidth?: unknown;
    receiptAutoCut?: unknown;
  }>,
  res: Response,
  next: NextFunction
) => {
  try {
    const settings = await updateTenantReceiptFooter(
      req.tenant.prisma,
      req.body.receiptFooter,
      req.body.thermalPaperProfile,
      req.body.thermalPaperWidth,
      req.body.receiptAutoCut
    );
    res.status(200).json({
      success: true,
      message: "Footer struk berhasil disimpan.",
      data: settings
    });
  } catch (error) {
    if (error instanceof ReceiptFooterValidationError) {
      res.status(400).json({ success: false, message: error.message });
      return;
    }
    next(error);
  }
};

export const resetProductDataset = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const deletedCounts = await resetTenantProductDataset(req.tenant.prisma);

    res.status(200).json({
      success: true,
      message: "Dataset produk berhasil dihapus.",
      data: deletedCounts
    });
  } catch (error) {
    console.error("Unexpected error while resetting product dataset:", error);
    next(error);
  }
};

export const changeStoreOwnerHandler = async (
  req: Request<unknown, unknown, { username?: string; password?: string }>,
  res: Response,
  next: NextFunction
) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      res.status(400).json({
        success: false,
        message: "Username dan password wajib diisi."
      });
      return;
    }

    const result = await changeServiceStoreOwner(
      req.tenant.prisma,
      req.tenant.storeId,
      req.user.id,
      username,
      password
    );

    res.status(200).json({
      success: true,
      message: `Kepemilikan toko berhasil dialihkan ke ${result.newOwnerName}.`,
      data: result
    });
  } catch (error) {
    if (error instanceof ChangeOwnerValidationError) {
      res.status(400).json({ success: false, message: error.message });
      return;
    }
    next(error);
  }
};

export const deleteStoreHandler = async (
  req: Request<unknown, unknown, { confirmation?: string }>,
  res: Response,
  next: NextFunction
) => {
  try {
    const { confirmation } = req.body;

    if (confirmation !== "HAPUS PERUSAHAAN") {
      res.status(400).json({
        success: false,
        message: "Ketik 'HAPUS PERUSAHAAN' untuk mengkonfirmasi."
      });
      return;
    }

    await deleteServiceStore(req.tenant.prisma, req.tenant.storeId);

    res.status(200).json({
      success: true,
      message: "Perusahaan dan semua datanya berhasil dihapus."
    });
  } catch (error) {
    next(error);
  }
};

export const inviteOwnerHandler = async (
  req: Request<unknown, unknown, { email?: string }>,
  res: Response,
  next: NextFunction
) => {
  try {
    const email = req.body.email?.trim() ?? "";

    if (!email) {
      res.status(400).json({
        success: false,
        message: "Email wajib diisi."
      });
      return;
    }

    const origin = req.headers.origin || appConfig.appUrl;
    const result = await createServiceOwnerInvitation(
      req.tenant.storeId,
      email,
      origin
    );

    res.status(200).json({
      success: true,
      message: `Undangan kepemilikan berhasil dibuat untuk ${email}.`,
      data: result
    });
  } catch (error) {
    if (error instanceof ChangeOwnerValidationError) {
      res.status(400).json({ success: false, message: error.message });
      return;
    }
    next(error);
  }
};
