import { Router } from "express";
import { z } from "zod";
import db from "../db";
import { authenticate } from "../middleware/auth";
import { validate, validateQuery } from "../middleware/validate";
import { AppError } from "../middleware/errorHandler";
import type { Transaction, TransactionItem, PaginatedResponse } from "../types";

const router = Router();

const paginationSchema = z.object({
  page: z.coerce.number().int().positive().optional().default(1),
  limit: z.coerce.number().int().positive().max(100).optional().default(10),
  sort: z.enum(["transactionNumber", "grandTotal", "createdAt"]).optional().default("createdAt"),
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

router.get("/", validateQuery(paginationSchema), (req, res) => {
  const { page, limit, sort, order, search, startDate, endDate } =
    req.query as unknown as z.infer<typeof paginationSchema>;
  const offset = (page - 1) * limit;

  const conditions: string[] = [];
  const params: unknown[] = [];

  if (search) {
    conditions.push("(t.transaction_number LIKE ? OR t.cashier_name LIKE ?)");
    params.push(`%${search}%`, `%${search}%`);
  }

  if (startDate) {
    conditions.push("t.created_at >= ?");
    params.push(startDate);
  }

  if (endDate) {
    conditions.push("t.created_at <= ?");
    params.push(endDate);
  }

  const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "";

  const countRow = db
    .prepare(`SELECT COUNT(*) as total FROM transactions t ${whereClause}`)
    .get(...params) as { total: number };
  const total = countRow.total;

  const rows = db
    .prepare(
      `SELECT t.id, t.transaction_number as transactionNumber, t.subtotal,
              t.discount_percent as discountPercent, t.discount_amount as discountAmount,
              t.grand_total as grandTotal, t.paid_amount as paidAmount,
              t.change_amount as change, t.cashier_name as cashierName, t.created_at as createdAt
       FROM transactions t
       ${whereClause}
       ORDER BY t.${sort} ${order}
       LIMIT ? OFFSET ?`,
    )
    .all(...params, limit, offset) as Omit<Transaction, "items">[];

  const ids = rows.map((r) => r.id);
  let itemsMap = new Map<string, TransactionItem[]>();

  if (ids.length > 0) {
    const placeholders = ids.map(() => "?").join(",");
    const itemRows = db
      .prepare(
        `SELECT transaction_id, product_id as productId, barcode, name, price, quantity, subtotal
         FROM transaction_items WHERE transaction_id IN (${placeholders})`,
      )
      .all(...ids) as (TransactionItem & { transaction_id: string })[];

    for (const row of itemRows) {
      const existing = itemsMap.get(row.transaction_id) ?? [];
      existing.push({
        productId: row.productId,
        barcode: row.barcode,
        name: row.name,
        price: row.price,
        quantity: row.quantity,
        subtotal: row.subtotal,
      });
      itemsMap.set(row.transaction_id, existing);
    }
  }

  const transactions: Transaction[] = rows.map((r) => ({
    ...r,
    items: itemsMap.get(r.id) ?? [],
  }));

  const result: PaginatedResponse<Transaction> = {
    items: transactions,
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit),
  };

  res.json({ status: "success", data: result });
});

router.get("/:id", (req, res) => {
  const transaction = db
    .prepare(
      `SELECT id, transaction_number as transactionNumber, subtotal,
              discount_percent as discountPercent, discount_amount as discountAmount,
              grand_total as grandTotal, paid_amount as paidAmount,
              change_amount as change, cashier_name as cashierName, created_at as createdAt
       FROM transactions WHERE id = ?`,
    )
    .get(req.params.id) as Omit<Transaction, "items"> | undefined;

  if (!transaction) {
    throw new AppError(404, "Transaksi tidak ditemukan");
  }

  const items = db
    .prepare(
      `SELECT product_id as productId, barcode, name, price, quantity, subtotal
       FROM transaction_items WHERE transaction_id = ?`,
    )
    .all(req.params.id) as TransactionItem[];

  res.json({ status: "success", data: { ...transaction, items } });
});

router.post("/", validate(createTransactionSchema), (req, res) => {
  const txn = req.body as z.infer<typeof createTransactionSchema>;

  const transactionNumber = generateTransactionNumber();
  const id = crypto.randomUUID();
  const now = new Date().toISOString();

  const insertTransaction = db.prepare(
    `INSERT INTO transactions (id, transaction_number, subtotal, discount_percent, discount_amount,
      grand_total, paid_amount, change_amount, cashier_name, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
  );

  const insertItem = db.prepare(
    `INSERT INTO transaction_items (transaction_id, product_id, barcode, name, price, quantity, subtotal)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
  );

  const updateStock = db.prepare(
    "UPDATE products SET stock = stock - ?, updated_at = datetime('now') WHERE id = ? AND stock >= ?",
  );

  const txnWrapper = db.transaction(() => {
    insertTransaction.run(id, transactionNumber, txn.subtotal, txn.discountPercent, txn.discountAmount, txn.grandTotal, txn.paidAmount, txn.change, txn.cashierName, now);

    for (const item of txn.items) {
      insertItem.run(id, item.productId, item.barcode, item.name, item.price, item.quantity, item.subtotal);
      const result = updateStock.run(item.quantity, item.productId, item.quantity);
      if (result.changes === 0) {
        throw new AppError(400, `Stok tidak mencukupi untuk ${item.name}`);
      }
    }
  });

  txnWrapper();

  const transaction = db
    .prepare(
      `SELECT id, transaction_number as transactionNumber, subtotal,
              discount_percent as discountPercent, discount_amount as discountAmount,
              grand_total as grandTotal, paid_amount as paidAmount,
              change_amount as change, cashier_name as cashierName, created_at as createdAt
       FROM transactions WHERE id = ?`,
    )
    .get(id) as Omit<Transaction, "items">;

  res.status(201).json({
    status: "success",
    data: { ...transaction, items: txn.items },
    message: "Transaksi berhasil",
  });
});

export default router;