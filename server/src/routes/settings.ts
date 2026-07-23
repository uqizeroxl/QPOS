import { Router } from "express";
import { z } from "zod";
import db from "../db";
import { authenticate, authorize } from "../middleware/auth";
import { validate } from "../middleware/validate";
import type { AppSettings } from "../types";

const router = Router();

const settingsSchema = z.object({
  storeName: z.string().min(1, "Nama toko wajib diisi").max(100),
  phone: z.string().max(20).optional().default(""),
  address: z.string().max(500).optional().default(""),
});

router.use(authenticate);

router.get("/", (_req, res) => {
  const rows = db.prepare("SELECT key, value FROM settings").all() as { key: string; value: string }[];
  const settingsMap = Object.fromEntries(rows.map((r) => [r.key, r.value]));

  const settings: AppSettings = {
    storeName: settingsMap.storeName ?? "Toko Saya",
    phone: settingsMap.phone ?? "",
    address: settingsMap.address ?? "",
  };

  res.json({ status: "success", data: settings });
});

router.put("/", authorize("admin", "manager"), validate(settingsSchema), (req, res) => {
  const { storeName, phone, address } = req.body as z.infer<typeof settingsSchema>;

  const upsert = db.prepare(
    "INSERT INTO settings (key, value) VALUES (?, ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value",
  );

  const settingsWrapper = db.transaction(() => {
    upsert.run("storeName", storeName);
    upsert.run("phone", phone);
    upsert.run("address", address);
  });

  settingsWrapper();

  const settings: AppSettings = { storeName, phone, address };
  res.json({ status: "success", data: settings, message: "Pengaturan berhasil disimpan" });
});

export default router;