import { Router } from "express";
import { z } from "zod";
import db from "../db";
import { authenticate, authorize } from "../middleware/auth";
import { validate, validateQuery } from "../middleware/validate";
import { AppError } from "../middleware/errorHandler";
import type { Product, PaginatedResponse } from "../types";

const router = Router();

const paginationSchema = z.object({
  page: z.coerce.number().int().positive().optional().default(1),
  limit: z.coerce.number().int().positive().max(100).optional().default(10),
  sort: z.enum(["barcode", "name", "category", "sellingPrice", "stock", "status"]).optional().default("name"),
  order: z.enum(["asc", "desc"]).optional().default("asc"),
  search: z.string().optional(),
  category: z.string().optional(),
  status: z.enum(["Aktif", "Nonaktif", "all"]).optional().default("all"),
  lowStock: z.coerce.boolean().optional(),
});

const createSchema = z.object({
  barcode: z.string().min(1, "Barcode wajib diisi").max(50),
  name: z.string().min(1, "Nama produk wajib diisi").max(200),
  category: z.string().min(1, "Kategori wajib diisi"),
  purchasePrice: z.number().min(0, "Harga beli tidak boleh negatif"),
  sellingPrice: z.number().min(0, "Harga jual tidak boleh negatif"),
  stock: z.number().int().min(0, "Stok tidak boleh negatif"),
  status: z.enum(["Aktif", "Nonaktif"]).optional().default("Aktif"),
});

const updateSchema = createSchema.partial();

router.use(authenticate);

router.get("/", validateQuery(paginationSchema), (req, res) => {
  const { page, limit, sort, order, search, category, status, lowStock } =
    req.query as unknown as z.infer<typeof paginationSchema>;
  const offset = (page - 1) * limit;

  const conditions: string[] = [];
  const params: unknown[] = [];

  if (search) {
    conditions.push("(p.name LIKE ? OR p.barcode LIKE ?)");
    params.push(`%${search}%`, `%${search}%`);
  }

  if (category) {
    conditions.push("p.category = ?");
    params.push(category);
  }

  if (status && status !== "all") {
    conditions.push("p.status = ?");
    params.push(status);
  }

  if (lowStock) {
    conditions.push("p.stock <= 5");
  }

  const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "";

  const countRow = db
    .prepare(`SELECT COUNT(*) as total FROM products p ${whereClause}`)
    .get(...params) as { total: number };
  const total = countRow.total;

  const allowedSorts = ["barcode", "name", "category", "sellingPrice", "stock", "status"];
  const sortColumn = allowedSorts.includes(sort as string) ? `p.${sort}` : "p.name";

  const items = db
    .prepare(
      `SELECT p.id, p.barcode, p.name, p.category, p.purchase_price as purchasePrice,
              p.selling_price as sellingPrice, p.stock, p.status
       FROM products p
       ${whereClause}
       ORDER BY ${sortColumn} ${order}
       LIMIT ? OFFSET ?`,
    )
    .all(...params, limit, offset) as Product[];

  const result: PaginatedResponse<Product> = {
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
      `SELECT id, barcode, name, category, purchase_price as purchasePrice,
              selling_price as sellingPrice, stock, status
       FROM products ORDER BY name ASC`,
    )
    .all() as Product[];

  res.json({ status: "success", data: items });
});

router.get("/low-stock", (_req, res) => {
  const items = db
    .prepare(
      `SELECT id, barcode, name, category, purchase_price as purchasePrice,
              selling_price as sellingPrice, stock, status
       FROM products WHERE stock <= 5 AND status = 'Aktif'
       ORDER BY stock ASC`,
    )
    .all() as Product[];

  res.json({ status: "success", data: items });
});

router.get("/:id", (req, res) => {
  const product = db
    .prepare(
      `SELECT id, barcode, name, category, purchase_price as purchasePrice,
              selling_price as sellingPrice, stock, status
       FROM products WHERE id = ?`,
    )
    .get(Number(req.params.id)) as Product | undefined;

  if (!product) {
    throw new AppError(404, "Produk tidak ditemukan");
  }

  res.json({ status: "success", data: product });
});

router.get("/barcode/:barcode", (req, res) => {
  const product = db
    .prepare(
      `SELECT id, barcode, name, category, purchase_price as purchasePrice,
              selling_price as sellingPrice, stock, status
       FROM products WHERE barcode = ?`,
    )
    .get(req.params.barcode) as Product | undefined;

  if (!product) {
    throw new AppError(404, "Produk tidak ditemukan");
  }

  res.json({ status: "success", data: product });
});

router.post("/", authorize("admin", "manager"), validate(createSchema), (req, res) => {
  const { barcode, name, category, purchasePrice, sellingPrice, stock, status } =
    req.body as z.infer<typeof createSchema>;

  const duplicate = db.prepare("SELECT id FROM products WHERE barcode = ?").get(barcode);
  if (duplicate) {
    throw new AppError(409, "Barcode sudah digunakan");
  }

  const catExists = db.prepare("SELECT id FROM categories WHERE name = ?").get(category);
  if (!catExists) {
    throw new AppError(400, "Kategori tidak valid");
  }

  const result = db
    .prepare(
      `INSERT INTO products (barcode, name, category, purchase_price, selling_price, stock, status)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
    )
    .run(barcode, name, category, purchasePrice, sellingPrice, stock, status);

  const product = db
    .prepare(
      `SELECT id, barcode, name, category, purchase_price as purchasePrice,
              selling_price as sellingPrice, stock, status
       FROM products WHERE id = ?`,
    )
    .get(result.lastInsertRowid) as Product;

  res.status(201).json({ status: "success", data: product, message: "Produk berhasil ditambahkan" });
});

router.put("/:id", authorize("admin", "manager"), validate(updateSchema), (req, res) => {
  const id = Number(req.params.id);
  const { barcode, name, category, purchasePrice, sellingPrice, stock, status } =
    req.body as z.infer<typeof updateSchema>;

  const existing = db.prepare("SELECT id FROM products WHERE id = ?").get(id);
  if (!existing) {
    throw new AppError(404, "Produk tidak ditemukan");
  }

  if (barcode) {
    const dup = db.prepare("SELECT id FROM products WHERE barcode = ? AND id != ?").get(barcode, id);
    if (dup) {
      throw new AppError(409, "Barcode sudah digunakan");
    }
  }

  if (category) {
    const catExists = db.prepare("SELECT id FROM categories WHERE name = ?").get(category);
    if (!catExists) {
      throw new AppError(400, "Kategori tidak valid");
    }
  }

  db.prepare(
    `UPDATE products SET
      barcode = COALESCE(?, barcode),
      name = COALESCE(?, name),
      category = COALESCE(?, category),
      purchase_price = COALESCE(?, purchase_price),
      selling_price = COALESCE(?, selling_price),
      stock = COALESCE(?, stock),
      status = COALESCE(?, status),
      updated_at = datetime('now')
    WHERE id = ?`,
  ).run(barcode ?? null, name ?? null, category ?? null, purchasePrice ?? null, sellingPrice ?? null, stock ?? null, status ?? null, id);

  const product = db
    .prepare(
      `SELECT id, barcode, name, category, purchase_price as purchasePrice,
              selling_price as sellingPrice, stock, status
       FROM products WHERE id = ?`,
    )
    .get(id) as Product;

  res.json({ status: "success", data: product, message: "Produk berhasil diperbarui" });
});

router.delete("/:id", authorize("admin", "manager"), (req, res) => {
  const id = Number(req.params.id);

  const existing = db.prepare("SELECT id FROM products WHERE id = ?").get(id);
  if (!existing) {
    throw new AppError(404, "Produk tidak ditemukan");
  }

  db.prepare("DELETE FROM products WHERE id = ?").run(id);

  res.json({ status: "success", data: null, message: "Produk berhasil dihapus" });
});

export default router;