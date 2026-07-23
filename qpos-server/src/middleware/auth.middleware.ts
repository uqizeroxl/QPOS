import { NextFunction, Request, Response } from "express";

import * as authService from "../services/auth.service";
import type { AuthUser } from "../services/auth.service";
import type { PrismaClient } from "../generated/prisma/client";
import {
  StoreTenantError,
  getStorePrisma
} from "../utils/store-prisma";

declare global {
  namespace Express {
    interface Request {
      user: AuthUser;
      tenant: {
        storeId: string;
        prisma: PrismaClient;
      };
    }
  }
}

export type AuthenticatedRequest = Request;

export const authenticate = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const authorization = req.headers.authorization;
    const token = authorization?.startsWith("Bearer ")
      ? authorization.slice("Bearer ".length)
      : "";

    if (!token) {
      res.status(401).json({
        success: false,
        message: "Token autentikasi wajib dikirim."
      });
      return;
    }

    const user = await authService.verifyToken(token);
    const prisma = await getStorePrisma(user.storeId);

    req.user = user;
    req.tenant = {
      storeId: user.storeId,
      prisma
    };
    next();
  } catch (error) {
    res.status(401).json({
      success: false,
      message:
        error instanceof authService.AuthTokenInvalidError ||
        error instanceof StoreTenantError
          ? error.message
          : "Token tidak valid."
    });
  }
};

export const authorize = (roles: authService.UserRole[]) => (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  if (!req.user || !req.tenant) {
    res.status(401).json({
      success: false,
      message: "User belum terautentikasi."
    });
    return;
  }

  if (!roles.includes(req.user.role)) {
    res.status(403).json({
      success: false,
      message: "Anda tidak memiliki akses ke fitur ini."
    });
    return;
  }

  next();
};
