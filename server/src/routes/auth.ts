import { Router } from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { z } from "zod";
import db from "../db";
import { validate } from "../middleware/validate";
import { AppError } from "../middleware/errorHandler";
import { authenticate } from "../middleware/auth";
import type { UserPublic, LoginResponse } from "../types";

const JWT_SECRET = process.env.JWT_SECRET ?? "qpos-default-secret";
const JWT_EXPIRES_IN = "24h";

const router = Router();

const loginSchema = z.object({
  username: z.string().min(1, "Username wajib diisi"),
  password: z.string().min(1, "Password wajib diisi"),
});

router.post("/login", validate(loginSchema), async (req, res, next) => {
  try {
    const { username, password } = req.body as z.infer<typeof loginSchema>;

    const user = db
      .prepare("SELECT * FROM users WHERE username = ?")
      .get(username) as {
      id: string;
      username: string;
      password: string;
      name: string;
      role: string;
    } | undefined;

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

    const userPublic: UserPublic = {
      id: user.id,
      username: user.username,
      name: user.name,
      role: user.role as UserPublic["role"],
      createdAt: "",
      updatedAt: "",
    };

    const response: LoginResponse = { token, user: userPublic };
    res.json({ status: "success", data: response, message: "Login berhasil" });
  } catch (err) {
    next(err);
  }
});

router.get("/me", authenticate, (req, res) => {
  const user = db.prepare("SELECT id, username, name, role FROM users WHERE id = ?").get(req.user!.userId) as UserPublic | undefined;

  if (!user) {
    throw new AppError(404, "User tidak ditemukan");
  }

  res.json({ status: "success", data: user });
});

router.post("/logout", authenticate, (_req, res) => {
  res.json({ status: "success", data: null, message: "Logout berhasil" });
});

export default router;