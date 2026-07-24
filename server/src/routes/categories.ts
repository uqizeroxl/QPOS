import { Router } from "express";
import { z } from "zod";
import { eq, and, ilike, count, asc, desc, sql } from "drizzle-orm";
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
    .enum(["name", "productCount", "status", "createdAt", "updatedAt"])
    .optional()
    .default("name"),
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

router.get("/", validateQuery(paginationSchema), async (req, res) => {
  const { page, limit, sort, order, search } =
    req.query as unknown as z.infer<typeof paginationSchema>;
  const offset = (page - 1) * limit;

  const conditions: any[] = [];
  if (search) {
    conditions.push(ilike(schema.categories.name, `%${search}%`));
  }
  const where = conditions.length > 0 ? and(...conditions) : undefined;

  const [{ total }] = await db
    .select({ total: count() })
    .from(schema.categories)
    .where(where);

  const items = await db.execute(sql`
    SELECT c.*,
      (SELECT COUNT(*) FROM products p WHERE p.category = c.name)::int as "productCount"
    FROM categories c
    ${where ? sql`WHERE ${where}` : sql``}
    ORDER BY ${sort === "productCount" ? sql`productCount` : sql`c.${sql.identifier(sort!)}`} ${order === "desc" ? sql`DESC` : sql`ASC`}
    LIMIT ${limit} OFFSET ${offset}
  `);

  const result: PaginatedResponse<any> = {
    items: items as any[],
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit),
  };

  res.json({ status: "success", data: result });
});

router.get("/all", async (_req, res) => {
  const items = await db.execute(sql`
    SELECT c.*,
      (SELECT COUNT(*) FROM products p WHERE p.category = c.name)::int as "productCount"
    FROM categories c ORDER BY c.name ASC
  `);

  res.json({ status: "success", data: items });
});

router.get("/:id", async (req, res) => {
  const [category] = await db.execute(sql`
    SELECT c.*,
      (SELECT COUNT(*) FROM products p WHERE p.category = c.name)::int as "productCount"
    FROM categories c WHERE c.id = ${Number(req.params.id)}
  `);

  if (!category) {
    throw new AppError(404, "Kategori tidak ditemukan");
  }

  res.json({ status: "success", data: category });
});

router.post(
  "/",
  authorize("admin", "manager"),
  validate(createSchema),
  async (req, res) => {
    const { name, description, status } =
      req.body as z.infer<typeof createSchema>;

    const [existing] = await db
      .select({ id: schema.categories.id })
      .from(schema.categories)
      .where(eq(schema.categories.name, name))
      .limit(1);

    if (existing) {
      throw new AppError(409, "Nama kategori sudah digunakan");
    }

    const [category] = await db
      .insert(schema.categories)
      .values({ name, description, status })
      .returning();

    res.status(201).json({
      status: "success",
      data: category,
      message: "Kategori berhasil ditambahkan",
    });
  },
);

router.put(
  "/:id",
  authorize("admin", "manager"),
  validate(updateSchema),
  async (req, res) => {
    const id = Number(req.params.id);
    const { name, description, status } =
      req.body as z.infer<typeof updateSchema>;

    const [existing] = await db
      .select()
      .from(schema.categories)
      .where(eq(schema.categories.id, id))
      .limit(1);

    if (!existing) {
      throw new AppError(404, "Kategori tidak ditemukan");
    }

    if (name && name !== existing.name) {
      const [dup] = await db
        .select({ id: schema.categories.id })
        .from(schema.categories)
        .where(and(eq(schema.categories.name, name), sql`id != ${id}`))
        .limit(1);

      if (dup) {
        throw new AppError(409, "Nama kategori sudah digunakan");
      }

      await db
        .update(schema.products)
        .set({ category: name })
        .where(eq(schema.products.category, existing.name));
    }

    const [category] = await db
      .update(schema.categories)
      .set({
        ...(name !== undefined && { name }),
        ...(description !== undefined && { description }),
        ...(status !== undefined && { status }),
        updatedAt: sql`now()`,
      })
      .where(eq(schema.categories.id, id))
      .returning();

    const [counted] = await db.execute(sql`
      SELECT COUNT(*)::int as "productCount" FROM products p WHERE p.category = ${category.name}
    `);

    res.json({
      status: "success",
      data: { ...category, productCount: (counted as any).productCount },
      message: "Kategori berhasil diperbarui",
    });
  },
);

router.delete("/:id", authorize("admin", "manager"), async (req, res) => {
  const id = Number(req.params.id);

  const [existing] = await db
    .select()
    .from(schema.categories)
    .where(eq(schema.categories.id, id))
    .limit(1);

  if (!existing) {
    throw new AppError(404, "Kategori tidak ditemukan");
  }

  const [{ productCount }] = await db
    .select({ productCount: count() })
    .from(schema.products)
    .where(eq(schema.products.category, existing.name));

  if (productCount > 0) {
    throw new AppError(
      400,
      `Tidak dapat menghapus kategori yang masih memiliki ${productCount} produk`,
    );
  }

  await db.delete(schema.categories).where(eq(schema.categories.id, id));

  res.json({
    status: "success",
    data: null,
    message: "Kategori berhasil dihapus",
  });
});

export default router;