import { Router } from "express";
import { z } from "zod";
import { eq, and, or, ilike, count, desc, sql } from "drizzle-orm";
import db, { schema } from "../db";
import { authenticate } from "../middleware/auth";
import { validate, validateQuery } from "../middleware/validate";
import { AppError } from "../middleware/errorHandler";
import type { PaginatedResponse } from "../types";

const router = Router();

const paginationSchema = z.object({
  page: z.coerce.number().int().positive().optional().default(1),
  limit: z.coerce.number().int().positive().max(100).optional().default(10),
  sort: z
    .enum(["transactionNumber", "grandTotal", "createdAt"])
    .optional()
    .default("createdAt"),
  order: z.enum(["asc", "desc"]).optional().default("desc"),
  search: z.string().optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
});

const transactionItemSchema = z.object({
  productId: z.number().int().positive(),
  barcode: z.string().min(1),
  name: z.string().min(1),
  price: z.number().min(0),
  quantity: z.number().int().positive(),
  subtotal: z.number().min(0),
});

const createTransactionSchema = z.object({
  items: z.array(transactionItemSchema).min(1, "Minimal 1 item"),
  subtotal: z.number().min(0),
  discountPercent: z.number().min(0).max(100).optional().default(0),
  discountAmount: z.number().min(0).optional().default(0),
  grandTotal: z.number().min(0),
  paidAmount: z.number().min(0),
  change: z.number().min(0),
  cashierName: z.string().optional().default(""),
});

function generateTransactionNumber(): string {
  const date = new Date();
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  const seq = String(Math.floor(Math.random() * 9999) + 1).padStart(4, "0");
  return `INV-${y}${m}${d}-${seq}`;
}

router.use(authenticate);

router.get("/", validateQuery(paginationSchema), async (req, res) => {
  const { page, limit, sort, order, search, startDate, endDate } =
    req.query as unknown as z.infer<typeof paginationSchema>;
  const offset = (page - 1) * limit;

  const conditions: any[] = [];

  if (search) {
    conditions.push(
      or(
        ilike(schema.transactions.transactionNumber, `%${search}%`),
        ilike(schema.transactions.cashierName, `%${search}%`),
      ),
    );
  }

  if (startDate) {
    conditions.push(sql`${schema.transactions.createdAt} >= ${startDate}::timestamp`);
  }

  if (endDate) {
    conditions.push(sql`${schema.transactions.createdAt} <= ${endDate}::timestamp`);
  }

  const where = conditions.length > 0 ? and(...conditions) : undefined;

  const [{ total }] = await db
    .select({ total: count() })
    .from(schema.transactions)
    .where(where);

  const sortCol =
    sort === "transactionNumber"
      ? schema.transactions.transactionNumber
      : sort === "grandTotal"
        ? schema.transactions.grandTotal
        : schema.transactions.createdAt;

  const rows = await db
    .select()
    .from(schema.transactions)
    .where(where)
    .orderBy(desc(sortCol))
    .limit(limit)
    .offset(offset);

  const ids = rows.map((r) => r.id);

  let itemsMap = new Map<string, any[]>();

  if (ids.length > 0) {
    const itemRows = await db
      .select()
      .from(schema.transactionItems)
      .where(sql`${schema.transactionItems.transactionId} = ANY(ARRAY[${ids.join(",")}]::uuid[])`);

    for (const row of itemRows) {
      const existing = itemsMap.get(row.transactionId) ?? [];
      existing.push({
        productId: row.productId,
        barcode: row.barcode,
        name: row.name,
        price: row.price,
        quantity: row.quantity,
        subtotal: row.subtotal,
      });
      itemsMap.set(row.transactionId, existing);
    }
  }

  const transactions = rows.map((r) => ({
    id: r.id,
    transactionNumber: r.transactionNumber,
    items: itemsMap.get(r.id) ?? [],
    subtotal: r.subtotal,
    discountPercent: r.discountPercent,
    discountAmount: r.discountAmount,
    grandTotal: r.grandTotal,
    paidAmount: r.paidAmount,
    change: r.change,
    cashierName: r.cashierName,
    createdAt: r.createdAt,
  }));

  const result: PaginatedResponse<any> = {
    items: transactions,
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit),
  };

  res.json({ status: "success", data: result });
});

router.get("/:id", async (req, res) => {
  const [row] = await db
    .select()
    .from(schema.transactions)
    .where(eq(schema.transactions.id, req.params.id))
    .limit(1);

  if (!row) {
    throw new AppError(404, "Transaksi tidak ditemukan");
  }

  const items = await db
    .select()
    .from(schema.transactionItems)
    .where(eq(schema.transactionItems.transactionId, row.id));

  res.json({
    status: "success",
    data: {
      ...row,
      items: items.map((i) => ({
        productId: i.productId,
        barcode: i.barcode,
        name: i.name,
        price: i.price,
        quantity: i.quantity,
        subtotal: i.subtotal,
      })),
    },
  });
});

router.post(
  "/",
  validate(createTransactionSchema),
  async (req, res) => {
    const txn = req.body as z.infer<typeof createTransactionSchema>;
    const transactionNumber = generateTransactionNumber();
    const id = crypto.randomUUID();

    await db.transaction(async (tx) => {
      await tx.insert(schema.transactions).values({
        id,
        transactionNumber,
        subtotal: txn.subtotal,
        discountPercent: txn.discountPercent,
        discountAmount: txn.discountAmount,
        grandTotal: txn.grandTotal,
        paidAmount: txn.paidAmount,
        change: txn.change,
        cashierName: txn.cashierName,
      });

      for (const item of txn.items) {
        await tx
          .insert(schema.transactionItems)
          .values({
            transactionId: id,
            productId: item.productId,
            barcode: item.barcode,
            name: item.name,
            price: item.price,
            quantity: item.quantity,
            subtotal: item.subtotal,
          });

        const [{ stock }] = await tx
          .select({ stock: schema.products.stock })
          .from(schema.products)
          .where(eq(schema.products.id, item.productId));

        if (stock < item.quantity) {
          throw new AppError(
            400,
            `Stok tidak mencukupi untuk ${item.name}`,
          );
        }

        await tx
          .update(schema.products)
          .set({
            stock: sql`stock - ${item.quantity}`,
            updatedAt: sql`now()`,
          })
          .where(eq(schema.products.id, item.productId));
      }
    });

    res.status(201).json({
      status: "success",
      data: { ...txn, id, transactionNumber },
      message: "Transaksi berhasil",
    });
  },
);

export default router;