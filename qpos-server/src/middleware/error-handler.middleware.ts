import { NextFunction, Request, Response } from "express";

import { appConfig } from "../config/app.config";

export const errorHandler = (
  err: Error,
  _req: Request,
  res: Response,
  _next: NextFunction
) => {
  res.status(500).json({
    message: "Internal server error",
    ...(appConfig.nodeEnv !== "production" && { error: err.message })
  });
};
