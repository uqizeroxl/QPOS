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
    .enum(["name", "phone", "createdAt", "updatedAt"])
    .optional()
    .default("name"),
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

const colMap: Record<string, any> = {
  name: schema.suppliers.name,
  phone: schema.suppliers.phone,
  createdAt: schema.suppliers.createdAt,
  updatedAt: schema.suppliers.updatedAt,
};

router.use(authenticate);

router.get("/", validateQuery(paginationSchema), async (req, res) => {
  const { page, limit, sort, order, search } =
    req.query as unknown as z.infer<typeof paginationSchema>;
  const offset = (page - 1) * limit;

  const conditions: any[] = [];
  if (search) {
    conditions.push(
      or(
        ilike(schema.suppliers.name, `%${search}%`),
        ilike(schema.suppliers.phone, `%${search}%`),
      ),
    );
  }
  const where = conditions.length > 0 ? and(...conditions) : undefined;

  const [{ total }] = await db
    .select({ total: count() })
    .from(schema.suppliers)
    .where(where);

  const sortCol = colMap[sort] ?? schema.suppliers.name;
  const orderFn = order === "desc" ? desc : asc;

  const items = await db
    .select()
    .from(schema.suppliers)
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
    .from(schema.suppliers)
    .orderBy(asc(schema.suppliers.name));

  res.json({ status: "success", data: items });
});

router.get("/:id", async (req, res) => {
  const [supplier] = await db
    .select()
    .from(schema.suppliers)
    .where(eq(schema.suppliers.id, Number(req.params.id)))
    .limit(1);

  if (!supplier) {
    throw new AppError(404, "Supplier tidak ditemukan");
  }

  res.json({ status: "success", data: supplier });
});

router.post(
  "/",
  authorize("admin", "manager"),
  validate(createSchema),
  async (req, res) => {
    const { name, phone, address, notes } =
      req.body as z.infer<typeof createSchema>;

    const [existing] = await db
      .select({ id: schema.suppliers.id })
      .from(schema.suppliers)
      .where(eq(schema.suppliers.name, name))
      .limit(1);

    if (existing) {
      throw new AppError(409, "Nama supplier sudah digunakan");
    }

    const [supplier] = await db
      .insert(schema.suppliers)
      .values({ name, phone, address, notes })
      .returning();

    res.status(201).json({
      status: "success",
      data: supplier,
      message: "Supplier berhasil ditambahkan",
    });
  },
);

router.put(
  "/:id",
  authorize("admin", "manager"),
  validate(updateSchema),
  async (req, res) => {
    const id = Number(req.params.id);
    const { name, phone, address, notes } =
      req.body as z.infer<typeof updateSchema>;

    const [existing] = await db
      .select({ id: schema.suppliers.id })
      .from(schema.suppliers)
      .where(eq(schema.suppliers.id, id))
      .limit(1);

    if (!existing) {
      throw new AppError(404, "Supplier tidak ditemukan");
    }

    if (name) {
      const [dup] = await db
        .select({ id: schema.suppliers.id })
        .from(schema.suppliers)
        .where(and(eq(schema.suppliers.name, name), sql`id != ${id}`))
        .limit(1);

      if (dup) {
        throw new AppError(409, "Nama supplier sudah digunakan");
      }
    }

    const [supplier] = await db
      .update(schema.suppliers)
      .set({
        ...(name !== undefined && { name }),
        ...(phone !== undefined && { phone }),
        ...(address !== undefined && { address }),
        ...(notes !== undefined && { notes }),
        updatedAt: sql`now()`,
      })
      .where(eq(schema.suppliers.id, id))
      .returning();

    res.json({
      status: "success",
      data: supplier,
      message: "Supplier berhasil diperbarui",
    });
  },
);

router.delete("/:id", authorize("admin", "manager"), async (req, res) => {
  const id = Number(req.params.id);

  const [existing] = await db
    .select({ id: schema.suppliers.id })
    .from(schema.suppliers)
    .where(eq(schema.suppliers.id, id))
    .limit(1);

  if (!existing) {
    throw new AppError(404, "Supplier tidak ditemukan");
  }

  await db.delete(schema.suppliers).where(eq(schema.suppliers.id, id));

  res.json({
    status: "success",
    data: null,
    message: "Supplier berhasil dihapus",
  });
});

export default router;