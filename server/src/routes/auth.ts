import { Router } from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { z } from "zod";
import { eq } from "drizzle-orm";
import db, { schema } from "../db";
import { validate } from "../middleware/validate";
import { AppError } from "../middleware/errorHandler";
import { authenticate } from "../middleware/auth";
import type { LoginResponse } from "../types";

const JWT_SECRET = process.env.JWT_SECRET ?? "qpos-default-secret";
const JWT_EXPIRES_IN = "24h";

const router = Router();

const loginSchema = z.object({
  username: z.string().min(1, "Username wajib diisi"),
  password: z.string().min(1, "Password wajib diisi"),
});

router.post("/login", validate(loginSchema), async (req, res) => {
  const { username, password } = req.body as z.infer<typeof loginSchema>;

  const [user] = await db
    .select()
    .from(schema.users)
    .where(eq(schema.users.username, username))
    .limit(1);

  if (!user) {
    throw new AppError(401, "Username atau password salah");
  }

  const valid = await bcrypt.compare(password, user.password);
  if (!valid) {
    throw new AppError(401, "Username atau password salah");
  }

  const token = jwt.sign(
    { userId: user.id, username: user.username, role: user.role },
    JWT_SECRET,
    { expiresIn: JWT_EXPIRES_IN },
  );

  const response: LoginResponse = {
    token,
    user: {
      id: user.id,
      username: user.username,
      name: user.name,
      role: user.role,
      createdAt: user.createdAt.toISOString(),
      updatedAt: user.updatedAt.toISOString(),
    },
  };

  res.json({ status: "success", data: response, message: "Login berhasil" });
});

router.get("/me", authenticate, async (req, res) => {
  const [user] = await db
    .select({
      id: schema.users.id,
      username: schema.users.username,
      name: schema.users.name,
      role: schema.users.role,
    })
    .from(schema.users)
    .where(eq(schema.users.id, req.user!.userId))
    .limit(1);

  if (!user) {
    throw new AppError(404, "User tidak ditemukan");
  }

  res.json({ status: "success", data: user });
});

router.post("/logout", authenticate, (_req, res) => {
  res.json({ status: "success", data: null, message: "Logout berhasil" });
});

export default router;