import { NextFunction, Request, Response } from "express";

import * as authService from "../services/auth.service";
import type { AuthenticatedRequest } from "../middleware/auth.middleware";

type LoginRequestBody = {
  username?: string;
  password?: string;
};

export const login = async (
  req: Request<unknown, unknown, LoginRequestBody>,
  res: Response,
  next: NextFunction
) => {
  try {
    const username = req.body.username?.trim() ?? "";
    const password = req.body.password ?? "";

    if (!username || !password) {
      res.status(400).json({
        success: false,
        message: "Username dan password wajib diisi."
      });
      return;
    }

    const auth = await authService.login(username, password);

    res.status(200).json({
      success: true,
      message: "Login berhasil.",
      data: auth
    });
  } catch (error) {
    if (
      error instanceof authService.InvalidCredentialsError ||
      error instanceof authService.UserInactiveError ||
      error instanceof authService.StoreMembershipRequiredError ||
      error instanceof authService.StoreInactiveError
    ) {
      res.status(401).json({
        success: false,
        message: error.message
      });
      return;
    }

    console.error("Unexpected error while logging in:", error);
    next(error);
  }
};

export const profile = (
  req: AuthenticatedRequest,
  res: Response
) => {
  res.status(200).json({
    success: true,
    message: "Profile retrieved successfully",
    data: req.user
  });
};

export const logout = (_req: Request, res: Response) => {
  res.status(200).json({
    success: true,
    message: "Logout berhasil."
  });
};
