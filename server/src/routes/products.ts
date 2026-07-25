import { Router } from "express";
import { z } from "zod";
import { eq, and, or, ilike, count, asc, desc, sql } from "drizzle-orm";
import db, { schema } from "../db";
import { authenticate, authorize } from "../middleware/auth";
import { validate, validateQuery } from "../middleware/validate";
import { AppError } from "../middleware/errorHandler";
import type { PaginatedResponse } from "../types";

const router = Router();

const paginationSchema = z.object({
  page: z.coerce.number().int().positive().optional().default(1),
  limit: z.coerce.number().int().positive().max(100).optional().default(10),
  sort: z
    .enum(["barcode", "name", "category", "sellingPrice", "stock", "status"])
    .optional()
    .default("name"),
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

const colMap: Record<string, any> = {
  barcode: schema.products.barcode,
  name: schema.products.name,
  category: schema.products.category,
  sellingPrice: schema.products.sellingPrice,
  stock: schema.products.stock,
  status: schema.products.status,
};

router.use(authenticate);

router.get("/", validateQuery(paginationSchema), async (req, res) => {
  const { page, limit, sort, order, search, category: catFilter, status, lowStock } =
    req.query as unknown as z.infer<typeof paginationSchema>;
  const offset = (page - 1) * limit;

  const conditions: any[] = [];

  if (search) {
    conditions.push(
      or(
        ilike(schema.products.name, `%${search}%`),
        ilike(schema.products.barcode, `%${search}%`),
      ),
    );
  }

  if (catFilter) {
    conditions.push(eq(schema.products.category, catFilter));
  }

  if (status && status !== "all") {
    conditions.push(eq(schema.products.status, status));
  }

  if (lowStock) {
    conditions.push(sql`${schema.products.stock} <= 5`);
  }

  const where = conditions.length > 0 ? and(...conditions) : undefined;

  const [{ total }] = await db
    .select({ total: count() })
    .from(schema.products)
    .where(where);

  const sortCol = colMap[sort] ?? schema.products.name;
  const orderFn = order === "desc" ? desc : asc;

  const items = await db
    .select()
    .from(schema.products)
    .where(where)
    .orderBy(orderFn(sortCol))
    .limit(limit)
    .offset(offset);

  const result: PaginatedResponse<any> = {
    items,
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit),
  };

  res.json({ status: "success", data: result });
});

router.get("/all", async (_req, res) => {
  const items = await db
    .select()
    .from(schema.products)
    .orderBy(asc(schema.products.name));

  res.json({ status: "success", data: items });
});

router.get("/low-stock", async (_req, res) => {
  const items = await db
    .select()
    .from(schema.products)
    .where(
      and(
        sql`${schema.products.stock} <= 5`,
        eq(schema.products.status, "Aktif"),
      ),
    )
    .orderBy(asc(schema.products.stock));

  res.json({ status: "success", data: items });
});

router.get("/:id", async (req, res) => {
  const [product] = await db
    .select()
    .from(schema.products)
    .where(eq(schema.products.id, Number(req.params.id)))
    .limit(1);

  if (!product) {
    throw new AppError(404, "Produk tidak ditemukan");
  }

  res.json({ status: "success", data: product });
});

router.get("/barcode/:barcode", async (req, res) => {
  const [product] = await db
    .select()
    .from(schema.products)
    .where(eq(schema.products.barcode, req.params.barcode))
    .limit(1);

  if (!product) {
    throw new AppError(404, "Produk tidak ditemukan");
  }

  res.json({ status: "success", data: product });
});

router.post(
  "/",
  authorize("admin", "manager"),
  validate(createSchema),
  async (req, res) => {
    const { barcode, name, category, purchasePrice, sellingPrice, stock, status } =
      req.body as z.infer<typeof createSchema>;

    const [duplicate] = await db
      .select({ id: schema.products.id })
      .from(schema.products)
      .where(eq(schema.products.barcode, barcode))
      .limit(1);

    if (duplicate) {
      throw new AppError(409, "Barcode sudah digunakan");
    }

    const [catExists] = await db
      .select({ id: schema.categories.id })
      .from(schema.categories)
      .where(eq(schema.categories.name, category))
      .limit(1);

    if (!catExists) {
      throw new AppError(400, "Kategori tidak valid");
    }

    const [product] = await db
      .insert(schema.products)
      .values({ barcode, name, category, purchasePrice, sellingPrice, stock, status })
      .returning();

    res.status(201).json({
      status: "success",
      data: product,
      message: "Produk berhasil ditambahkan",
    });
  },
);

router.put(
  "/:id",
  authorize("admin", "manager"),
  validate(updateSchema),
  async (req, res) => {
    const id = Number(req.params.id);
    const { barcode, name, category, purchasePrice, sellingPrice, stock, status } =
      req.body as z.infer<typeof updateSchema>;

    const [existing] = await db
      .select({ id: schema.products.id })
      .from(schema.products)
      .where(eq(schema.products.id, id))
      .limit(1);

    if (!existing) {
      throw new AppError(404, "Produk tidak ditemukan");
    }

    if (barcode) {
      const [dup] = await db
        .select({ id: schema.products.id })
        .from(schema.products)
        .where(and(eq(schema.products.barcode, barcode), sql`id != ${id}`))
        .limit(1);

      if (dup) {
        throw new AppError(409, "Barcode sudah digunakan");
      }
    }

    if (category) {
      const [catExists] = await db
        .select({ id: schema.categories.id })
        .from(schema.categories)
        .where(eq(schema.categories.name, category))
        .limit(1);

      if (!catExists) {
        throw new AppError(400, "Kategori tidak valid");
      }
    }

    const [product] = await db
      .update(schema.products)
      .set({
        ...(barcode !== undefined && { barcode }),
        ...(name !== undefined && { name }),
        ...(category !== undefined && { category }),
        ...(purchasePrice !== undefined && { purchasePrice }),
        ...(sellingPrice !== undefined && { sellingPrice }),
        ...(stock !== undefined && { stock }),
        ...(status !== undefined && { status }),
        updatedAt: sql`now()`,
      })
      .where(eq(schema.products.id, id))
      .returning();

    res.json({
      status: "success",
      data: product,
      message: "Produk berhasil diperbarui",
    });
  },
);

router.delete("/:id", authorize("admin", "manager"), async (req, res) => {
  const id = Number(req.params.id);

  const [existing] = await db
    .select({ id: schema.products.id })
    .from(schema.products)
    .where(eq(schema.products.id, id))
    .limit(1);

  if (!existing) {
    throw new AppError(404, "Produk tidak ditemukan");
  }

  await db.delete(schema.products).where(eq(schema.products.id, id));

  res.json({ status: "success", data: null, message: "Produk berhasil dihapus" });
});

export default router;