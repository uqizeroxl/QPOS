import { NextFunction, Request, Response } from "express";

import * as dashboardService from "../services/dashboard.service";

export const getDashboard = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const prisma = req.tenant.prisma;
    const dashboard = await dashboardService.getDashboard(prisma);

    res.status(200).json({
      success: true,
      message: "Dashboard retrieved successfully",
      data: dashboard
    });
  } catch (error) {
    console.error("Unexpected error while retrieving dashboard:", error);
    next(error);
  }
};
