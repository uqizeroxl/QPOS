import { Router } from "express";
import multer from "multer";

import { UserRole } from "../generated/prisma/client";
import { authorize } from "../middleware/auth.middleware";
import {
  adjustProductStock,
  bulkDeleteProducts,
  bulkUpdateProducts,
  createProduct,
  deleteProduct,
  exportProductDataset,
  generateProductBarcode,
  getAllProducts,
  getProductStockHistory,
  getStockHistories,
  importProductDataset,
  previewProductDatasetImport,
  restockProducts,
  searchCashierProducts,
  searchRestockProducts,
  updateProduct
} from "../controllers/product.controller";

const router = Router();
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024
  }
});
const ownerAdminWarehouse = [UserRole.OWNER, UserRole.ADMIN, UserRole.WAREHOUSE];
const allRoles = [
  UserRole.OWNER,
  UserRole.ADMIN,
  UserRole.CASHIER,
  UserRole.WAREHOUSE
];

router.get("/", authorize(allRoles), getAllProducts);
router.get("/stock-history", authorize(ownerAdminWarehouse), getStockHistories);
router.get("/dataset/export", authorize(ownerAdminWarehouse), exportProductDataset);
router.post("/dataset/preview", authorize(ownerAdminWarehouse), upload.single("file"), previewProductDatasetImport);
router.post("/dataset/import", authorize(ownerAdminWarehouse), upload.single("file"), importProductDataset);
router.post("/restocks", authorize(ownerAdminWarehouse), restockProducts);
router.get("/restocks/search", authorize(ownerAdminWarehouse), searchRestockProducts);
router.get("/cashier/search", authorize(allRoles), searchCashierProducts);
router.post("/", authorize(ownerAdminWarehouse), createProduct);
router.post("/bulk-delete", authorize(ownerAdminWarehouse), bulkDeleteProducts);
router.put("/bulk-update", authorize(ownerAdminWarehouse), bulkUpdateProducts);
router.put("/:id", authorize(ownerAdminWarehouse), updateProduct);
router.delete("/:id", authorize(ownerAdminWarehouse), deleteProduct);
router.post("/:id/barcode", authorize(ownerAdminWarehouse), generateProductBarcode);
router.post("/:id/stock-adjustments", authorize(ownerAdminWarehouse), adjustProductStock);
router.get("/:id/stock-history", authorize(ownerAdminWarehouse), getProductStockHistory);

export default router;
