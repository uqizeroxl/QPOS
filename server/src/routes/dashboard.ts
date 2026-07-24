import { Router } from "express";
import { sql, eq, and, asc } from "drizzle-orm";
import db, { schema } from "../db";
import { authenticate } from "../middleware/auth";

const router = Router();

router.use(authenticate);

router.get("/stats", async (_req, res) => {
  const [productCount] = await db.execute(sql`SELECT COUNT(*)::int FROM products`);
  const [categoryCount] = await db.execute(sql`SELECT COUNT(*)::int FROM categories`);
  const [supplierCount] = await db.execute(sql`SELECT COUNT(*)::int FROM suppliers`);
  const [lowStockCount] = await db.execute(sql`SELECT COUNT(*)::int FROM products WHERE stock <= 5 AND status = 'Aktif'`);
  const [todayTransactionCount] = await db.execute(sql`SELECT COUNT(*)::int FROM transactions WHERE created_at::date = CURRENT_DATE`);
  const [inventoryValue] = await db.execute(sql`SELECT COALESCE(SUM(purchase_price * stock), 0)::float FROM products WHERE status = 'Aktif'`);
  const [todayRevenue] = await db.execute(sql`SELECT COALESCE(SUM(grand_total), 0)::float FROM transactions WHERE created_at::date = CURRENT_DATE`);

  const lowStockItems = await db
    .select({
      id: schema.products.id,
      barcode: schema.products.barcode,
      name: schema.products.name,
      category: schema.products.category,
      stock: schema.products.stock,
      sellingPrice: schema.products.sellingPrice,
    })
    .from(schema.products)
    .where(
      and(
        sql`${schema.products.stock} <= 5`,
        eq(schema.products.status, "Aktif"),
      ),
    )
    .orderBy(asc(schema.products.stock))
    .limit(10);

  const recentTransactions = await db
    .select({
      id: schema.transactions.id,
      transactionNumber: schema.transactions.transactionNumber,
      grandTotal: schema.transactions.grandTotal,
      createdAt: schema.transactions.createdAt,
    })
    .from(schema.transactions)
    .orderBy(asc(schema.transactions.createdAt))
    .limit(10);

  res.json({
    status: "success",
    data: {
      productCount: (productCount as any).count ?? 0,
      categoryCount: (categoryCount as any).count ?? 0,
      supplierCount: (supplierCount as any).count ?? 0,
      lowStockCount: (lowStockCount as any).count ?? 0,
      todayTransactionCount: (todayTransactionCount as any).count ?? 0,
      inventoryValue: (inventoryValue as any).coalesce ?? 0,
      todayRevenue: (todayRevenue as any).coalesce ?? 0,
      lowStockItems,
      recentTransactions,
    },
  });
});

export default router;