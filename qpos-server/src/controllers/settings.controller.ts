import type { NextFunction, Request, Response } from "express";

import { resetProductDataset as resetTenantProductDataset } from "../services/settings.service";

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
