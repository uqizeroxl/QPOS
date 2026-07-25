import type { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { AppError } from "./errorHandler";
import type { UserRole } from "../types";

const JWT_SECRET = process.env.JWT_SECRET ?? "qpos-default-secret";

export type JwtPayload = {
  userId: string;
  username: string;
  role: UserRole;
};

declare global {
  namespace Express {
    interface Request {
      user?: JwtPayload;
    }
  }
}

export function authenticate(req: Request, _res: Response, next: NextFunction) {
  const header = req.headers.authorization;
  if (!header || !header.startsWith("Bearer ")) {
    throw new AppError(401, "Token tidak ditemukan");
  }

  const token = header.slice(7);
  try {
    const payload = jwt.verify(token, JWT_SECRET) as JwtPayload;
    req.user = payload;
    next();
  } catch {
    throw new AppError(401, "Token tidak valid atau sudah kedaluwarsa");
  }
}

export function authorize(...roles: UserRole[]) {
  return (req: Request, _res: Response, next: NextFunction) => {
    if (!req.user) {
      throw new AppError(401, "Unauthorized");
    }
    if (!roles.includes(req.user.role)) {
      throw new AppError(403, "Akses ditolak");
    }
    next();
  };
}