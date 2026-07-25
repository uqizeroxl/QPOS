import { Router } from "express";
import { z } from "zod";
import { eq, sql } from "drizzle-orm";
import db, { schema } from "../db";
import { authenticate, authorize } from "../middleware/auth";
import { validate } from "../middleware/validate";

const router = Router();

const settingsSchema = z.object({
  storeName: z.string().min(1, "Nama toko wajib diisi").max(100),
  phone: z.string().max(20).optional().default(""),
  address: z.string().max(500).optional().default(""),
});

router.use(authenticate);

router.get("/", async (_req, res) => {
  const rows = await db
    .select()
    .from(schema.settings);

  const settingsMap = Object.fromEntries(
    rows.map((r) => [r.key, r.value]),
  );

  const settings = {
    storeName: settingsMap.storeName ?? "Toko Saya",
    phone: settingsMap.phone ?? "",
    address: settingsMap.address ?? "",
  };

  res.json({ status: "success", data: settings });
});

router.put(
  "/",
  authorize("admin", "manager"),
  validate(settingsSchema),
  async (req, res) => {
    const { storeName, phone, address } = req.body as z.infer<typeof settingsSchema>;

    const entries = [
      { key: "storeName", value: storeName },
      { key: "phone", value: phone },
      { key: "address", value: address },
    ];

    await db.transaction(async (tx) => {
      for (const entry of entries) {
        await tx
          .insert(schema.settings)
          .values(entry)
          .onConflictDoUpdate({
            target: schema.settings.key,
            set: { value: entry.value },
          });
      }
    });

    res.json({
      status: "success",
      data: { storeName, phone, address },
      message: "Pengaturan berhasil disimpan",
    });
  },
);

export default router;