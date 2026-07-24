import type { NextFunction, Request, Response } from "express";

import {
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
  req: Request<unknown, unknown, { receiptFooter?: unknown }>,
  res: Response,
  next: NextFunction
) => {
  try {
    const settings = await updateTenantReceiptFooter(
      req.tenant.prisma,
      req.body.receiptFooter
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
