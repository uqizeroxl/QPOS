import { Router } from "express";

import {
  changeStoreOwnerHandler,
  deleteStoreHandler,
  inviteOwnerHandler,
  getSettings,
  resetProductDataset,
  updateSettings,
  updateReceiptFooter
} from "../controllers/settings.controller";
import { UserRole } from "../generated/prisma/client";
import { authorize } from "../middleware/auth.middleware";

const router = Router();

router.get("/", getSettings);
router.put("/", authorize([UserRole.OWNER]), updateSettings);
router.get("/receipt-footer", getSettings);
router.put("/receipt-footer", authorize([UserRole.OWNER]), updateReceiptFooter);
router.post(
  "/product-dataset/reset",
  authorize([UserRole.OWNER]),
  resetProductDataset
);
router.post(
  "/change-owner",
  authorize([UserRole.OWNER]),
  changeStoreOwnerHandler
);
router.post(
  "/delete-company",
  authorize([UserRole.OWNER]),
  deleteStoreHandler
);
router.post(
  "/invite-owner",
  authorize([UserRole.OWNER]),
  inviteOwnerHandler
);

export default router;
