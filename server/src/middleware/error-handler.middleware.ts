import { NextFunction, Request, Response } from "express";

import { appConfig } from "../config/app.config";

export const errorHandler = (
  err: Error,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  if (res.headersSent) {
    next(err);
    return;
  }

  console.error("Unhandled server error:", {
    method: req.method,
    path: req.originalUrl,
    message: err.message,
    stack: appConfig.nodeEnv === "production" ? undefined : err.stack
  });

  res.status(500).json({
    success: false,
    message: "Terjadi kesalahan pada server.",
    ...(appConfig.nodeEnv !== "production" && { error: err.message })
  });
};
