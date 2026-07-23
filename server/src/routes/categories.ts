import { Router } from "express";
import { z } from "zod";
import db from "../db";
import { authenticate, authorize } from "../middleware/auth";
import { validate, validateQuery } from "../middleware/validate";
import { AppError } from "../middleware/errorHandler";
import type { Category, PaginatedResponse } from "../types";

const router = Router();

const paginationSchema = z.object({
  page: z.coerce.number().int().positive().optional().default(1),
  limit: z.coerce.number().int().positive().max(100).optional().default(10),
  sort: z.enum(["name", "productCount", "status", "createdAt", "updatedAt"]).optional().default("name"),
  order: z.enum(["asc", "desc"]).optional().default("asc"),
  search: z.string().optional(),
});

const createSchema = z.object({
  name: z.string().min(1, "Nama kategori wajib diisi").max(100),
  description: z.string().max(500).optional().default(""),
  status: z.enum(["Aktif", "Nonaktif"]).optional().default("Aktif"),
});

const updateSchema = createSchema.partial();

router.use(authenticate);

router.get("/", validateQuery(paginationSchema), (req, res) => {
  const { page, limit, sort, order, search } = req.query as unknown as z.infer<typeof paginationSchema>;
  const offset = (page - 1) * limit;

  let whereClause = "";
  const params: unknown[] = [];

  if (search) {
    whereClause = "WHERE c.name LIKE ?";
    params.push(`%${search}%`);
  }

  const sortColumn = sort === "productCount" ? "(SELECT COUNT(*) FROM products p WHERE p.category = c.name)" : `c.${sort}`;

  const countRow = db.prepare(`SELECT COUNT(*) as total FROM categories c ${whereClause}`).get(...params) as { total: number };
  const total = countRow.total;

  const items = db
    .prepare(
      `SELECT c.*,
        (SELECT COUNT(*) FROM products p WHERE p.category = c.name) as productCount
       FROM categories c
       ${whereClause}
       ORDER BY ${sortColumn} ${order}
       LIMIT ? OFFSET ?`,
    )
    .all(...params, limit, offset) as Category[];

  const result: PaginatedResponse<Category> = {
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
      `SELECT c.*,
        (SELECT COUNT(*) FROM products p WHERE p.category = c.name) as productCount
       FROM categories c
       ORDER BY c.name ASC`,
    )
    .all() as Category[];

  res.json({ status: "success", data: items });
});

router.get("/:id", (req, res) => {
  const category = db
    .prepare(
      `SELECT c.*,
        (SELECT COUNT(*) FROM products p WHERE p.category = c.name) as productCount
       FROM categories c WHERE c.id = ?`,
    )
    .get(Number(req.params.id)) as Category | undefined;

  if (!category) {
    throw new AppError(404, "Kategori tidak ditemukan");
  }

  res.json({ status: "success", data: category });
});

router.post("/", authorize("admin", "manager"), validate(createSchema), (req, res) => {
  const { name, description, status } = req.body as z.infer<typeof createSchema>;

  const existing = db.prepare("SELECT id FROM categories WHERE name = ?").get(name);
  if (existing) {
    throw new AppError(409, "Nama kategori sudah digunakan");
  }

  const result = db
    .prepare(
      "INSERT INTO categories (name, description, status) VALUES (?, ?, ?)",
    )
    .run(name, description, status);

  const category = db.prepare("SELECT * FROM categories WHERE id = ?").get(result.lastInsertRowid) as Category;

  res.status(201).json({ status: "success", data: category, message: "Kategori berhasil ditambahkan" });
});

router.put("/:id", authorize("admin", "manager"), validate(updateSchema), (req, res) => {
  const { name, description, status } = req.body as z.infer<typeof updateSchema>;
  const id = Number(req.params.id);

  const existing = db.prepare("SELECT * FROM categories WHERE id = ?").get(id) as Category | undefined;
  if (!existing) {
    throw new AppError(404, "Kategori tidak ditemukan");
  }

  if (name && name !== existing.name) {
    const duplicate = db.prepare("SELECT id FROM categories WHERE name = ? AND id != ?").get(name, id);
    if (duplicate) {
      throw new AppError(409, "Nama kategori sudah digunakan");
    }
    db.prepare("UPDATE products SET category = ? WHERE category = ?").run(name, existing.name);
  }

  db.prepare(
    "UPDATE categories SET name = COALESCE(?, name), description = COALESCE(?, description), status = COALESCE(?, status), updated_at = datetime('now') WHERE id = ?",
  ).run(name ?? null, description ?? null, status ?? null, id);

  const category = db
    .prepare(
      `SELECT c.*,
        (SELECT COUNT(*) FROM products p WHERE p.category = c.name) as productCount
       FROM categories c WHERE c.id = ?`,
    )
    .get(id) as Category;

  res.json({ status: "success", data: category, message: "Kategori berhasil diperbarui" });
});

router.delete("/:id", authorize("admin", "manager"), (req, res) => {
  const id = Number(req.params.id);

  const existing = db.prepare("SELECT * FROM categories WHERE id = ?").get(id) as Category | undefined;
  if (!existing) {
    throw new AppError(404, "Kategori tidak ditemukan");
  }

  const productCount = (
    db.prepare("SELECT COUNT(*) as count FROM products WHERE category = ?").get(existing.name) as { count: number }
  ).count;

  if (productCount > 0) {
    throw new AppError(400, `Tidak dapat menghapus kategori yang masih memiliki ${productCount} produk`);
  }

  db.prepare("DELETE FROM categories WHERE id = ?").run(id);

  res.json({ status: "success", data: null, message: "Kategori berhasil dihapus" });
});

export default router;