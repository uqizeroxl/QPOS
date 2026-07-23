import { Router } from "express";
import db from "../db";
import { authenticate } from "../middleware/auth";

const router = Router();

router.use(authenticate);

router.get("/stats", (_req, res) => {
  const productCount = (db.prepare("SELECT COUNT(*) as count FROM products").get() as { count: number }).count;
  const categoryCount = (db.prepare("SELECT COUNT(*) as count FROM categories").get() as { count: number }).count;
  const supplierCount = (db.prepare("SELECT COUNT(*) as count FROM suppliers").get() as { count: number }).count;
  const lowStockCount = (db.prepare("SELECT COUNT(*) as count FROM products WHERE stock <= 5 AND status = 'Aktif'").get() as { count: number }).count;
  const todayTransactionCount = (db.prepare("SELECT COUNT(*) as count FROM transactions WHERE date(created_at) = date('now')").get() as { count: number }).count;

  const inventoryValue = db
    .prepare("SELECT COALESCE(SUM(purchase_price * stock), 0) as value FROM products WHERE status = 'Aktif'")
    .get() as { value: number };

  const todayRevenue = db
    .prepare("SELECT COALESCE(SUM(grand_total), 0) as total FROM transactions WHERE date(created_at) = date('now')")
    .get() as { total: number };

  const lowStockItems = db
    .prepare(
      `SELECT id, barcode, name, category, stock, selling_price as sellingPrice
       FROM products WHERE stock <= 5 AND status = 'Aktif'
       ORDER BY stock ASC LIMIT 10`,
    )
    .all();

  const recentTransactions = db
    .prepare(
      `SELECT id, transaction_number as transactionNumber, grand_total as grandTotal, created_at as createdAt
       FROM transactions ORDER BY created_at DESC LIMIT 10`,
    )
    .all();

  res.json({
    status: "success",
    data: {
      productCount,
      categoryCount,
      supplierCount,
      lowStockCount,
      todayTransactionCount,
      inventoryValue: inventoryValue.value,
      todayRevenue: todayRevenue.total,
      lowStockItems,
      recentTransactions,
    },
  });
});

export default router;