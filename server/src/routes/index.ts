import { Router } from "express";

import authRoutes from "./auth.routes";
import categoryRoutes from "./category.routes";
import dashboardRoutes from "./dashboard.routes";
import healthRoutes from "./health.routes";
import memberRoutes from "./member.routes";
import productRoutes from "./product.routes";
import reportRoutes from "./report.routes";
import settingsRoutes from "./settings.routes";
import supplierRoutes from "./supplier.routes";
import transactionRoutes from "./transaction.routes";
import { authenticate, authorize } from "../middleware/auth.middleware";
import { UserRole } from "../generated/prisma/client";

const router = Router();
const ownerAdminWarehouse = [UserRole.OWNER, UserRole.ADMIN, UserRole.WAREHOUSE];
const ownerAdminCashier = [UserRole.OWNER, UserRole.ADMIN, UserRole.CASHIER];
const allRoles = [
  UserRole.OWNER,
  UserRole.ADMIN,
  UserRole.CASHIER,
  UserRole.WAREHOUSE
];

router.use("/", healthRoutes);
router.use("/api/auth", authRoutes);
router.use("/api/categories", authenticate, authorize(ownerAdminWarehouse), categoryRoutes);
router.use("/api/dashboard", authenticate, authorize(allRoles), dashboardRoutes);
router.use("/api/products", authenticate, productRoutes);
router.use("/api/reports", authenticate, authorize([UserRole.OWNER, UserRole.ADMIN]), reportRoutes);
router.use("/api/members", authenticate, memberRoutes);
router.use("/api/settings", authenticate, settingsRoutes);
router.use("/api/suppliers", authenticate, authorize(ownerAdminWarehouse), supplierRoutes);
router.use("/api/transactions", authenticate, authorize(ownerAdminCashier), transactionRoutes);

export default router;
