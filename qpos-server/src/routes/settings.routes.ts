import { Router } from "express";

import {
  getReceiptFooter,
  resetProductDataset,
  updateReceiptFooter
} from "../controllers/settings.controller";
import { UserRole } from "../generated/prisma/client";
import { authorize } from "../middleware/auth.middleware";

const router = Router();

router.get("/receipt-footer", getReceiptFooter);
router.put("/receipt-footer", authorize([UserRole.OWNER]), updateReceiptFooter);
router.post(
  "/product-dataset/reset",
  authorize([UserRole.OWNER]),
  resetProductDataset
);

export default router;
