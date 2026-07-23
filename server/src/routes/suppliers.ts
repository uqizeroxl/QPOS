import { Router } from "express";
import { z } from "zod";
import db from "../db";
import { authenticate, authorize } from "../middleware/auth";
import { validate, validateQuery } from "../middleware/validate";
import { AppError } from "../middleware/errorHandler";
import type { Supplier, PaginatedResponse } from "../types";

const router = Router();

const paginationSchema = z.object({
  page: z.coerce.number().int().positive().optional().default(1),
  limit: z.coerce.number().int().positive().max(100).optional().default(10),
  sort: z.enum(["name", "phone", "createdAt", "updatedAt"]).optional().default("name"),
  order: z.enum(["asc", "desc"]).optional().default("asc"),
  search: z.string().optional(),
});

const createSchema = z.object({
  name: z.string().min(1, "Nama supplier wajib diisi").max(100),
  phone: z.string().max(20).optional().default(""),
  address: z.string().max(500).optional().default(""),
  notes: z.string().max(1000).optional().default(""),
});

const updateSchema = createSchema.partial();

router.use(authenticate);

router.get("/", validateQuery(paginationSchema), (req, res) => {
  const { page, limit, sort, order, search } = req.query as unknown as z.infer<typeof paginationSchema>;
  const offset = (page - 1) * limit;

  let whereClause = "";
  const params: unknown[] = [];

  if (search) {
    whereClause = "WHERE name LIKE ? OR phone LIKE ?";
    params.push(`%${search}%`, `%${search}%`);
  }

  const countRow = db.prepare(`SELECT COUNT(*) as total FROM suppliers ${whereClause}`).get(...params) as { total: number };
  const total = countRow.total;

  const items = db
    .prepare(
      `SELECT id, name, phone, address, notes, created_at as createdAt, updated_at as updatedAt
       FROM suppliers ${whereClause}
       ORDER BY ${sort} ${order}
       LIMIT ? OFFSET ?`,
    )
    .all(...params, limit, offset) as Supplier[];

  const result: PaginatedResponse<Supplier> = {
    items,
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit),
  };

  res.json({ status: "success", data: result });
});

router.get("/all", (_req, res) => {
  const items = db
    .prepare(
      `SELECT id, name, phone, address, notes, created_at as createdAt, updated_at as updatedAt
       FROM suppliers ORDER BY name ASC`,
    )
    .all() as Supplier[];

  res.json({ status: "success", data: items });
});

router.get("/:id", (req, res) => {
  const supplier = db
    .prepare(
      `SELECT id, name, phone, address, notes, created_at as createdAt, updated_at as updatedAt
       FROM suppliers WHERE id = ?`,
    )
    .get(Number(req.params.id)) as Supplier | undefined;

  if (!supplier) {
    throw new AppError(404, "Supplier tidak ditemukan");
  }

  res.json({ status: "success", data: supplier });
});

router.post("/", authorize("admin", "manager"), validate(createSchema), (req, res) => {
  const { name, phone, address, notes } = req.body as z.infer<typeof createSchema>;

  const existing = db.prepare("SELECT id FROM suppliers WHERE name = ?").get(name);
  if (existing) {
    throw new AppError(409, "Nama supplier sudah digunakan");
  }

  const result = db
    .prepare("INSERT INTO suppliers (name, phone, address, notes) VALUES (?, ?, ?, ?)")
    .run(name, phone, address, notes);

  const supplier = db
    .prepare(
      `SELECT id, name, phone, address, notes, created_at as createdAt, updated_at as updatedAt
       FROM suppliers WHERE id = ?`,
    )
    .get(result.lastInsertRowid) as Supplier;

  res.status(201).json({ status: "success", data: supplier, message: "Supplier berhasil ditambahkan" });
});

router.put("/:id", authorize("admin", "manager"), validate(updateSchema), (req, res) => {
  const id = Number(req.params.id);
  const { name, phone, address, notes } = req.body as z.infer<typeof updateSchema>;

  const existing = db.prepare("SELECT id FROM suppliers WHERE id = ?").get(id);
  if (!existing) {
    throw new AppError(404, "Supplier tidak ditemukan");
  }

  if (name) {
    const dup = db.prepare("SELECT id FROM suppliers WHERE name = ? AND id != ?").get(name, id);
    if (dup) {
      throw new AppError(409, "Nama supplier sudah digunakan");
    }
  }

  db.prepare(
    `UPDATE suppliers SET
      name = COALESCE(?, name),
      phone = COALESCE(?, phone),
      address = COALESCE(?, address),
      notes = COALESCE(?, notes),
      updated_at = datetime('now')
    WHERE id = ?`,
  ).run(name ?? null, phone ?? null, address ?? null, notes ?? null, id);

  const supplier = db
    .prepare(
      `SELECT id, name, phone, address, notes, created_at as createdAt, updated_at as updatedAt
       FROM suppliers WHERE id = ?`,
    )
    .get(id) as Supplier;

  res.json({ status: "success", data: supplier, message: "Supplier berhasil diperbarui" });
});

router.delete("/:id", authorize("admin", "manager"), (req, res) => {
  const id = Number(req.params.id);

  const existing = db.prepare("SELECT id FROM suppliers WHERE id = ?").get(id);
  if (!existing) {
    throw new AppError(404, "Supplier tidak ditemukan");
  }

  db.prepare("DELETE FROM suppliers WHERE id = ?").run(id);

  res.json({ status: "success", data: null, message: "Supplier berhasil dihapus" });
});

export default router;