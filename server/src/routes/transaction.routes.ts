import { Router } from "express";

import {
  createTransaction,
  getTransactionById,
  getTransactions,
  resetTransactionHistory
} from "../controllers/transaction.controller";
import { UserRole } from "../generated/prisma/client";
import { authorize } from "../middleware/auth.middleware";
import { transactionLimiter } from "../middleware/rate-limiter.middleware";

const router = Router();

router.get("/", getTransactions);
router.post("/", transactionLimiter, createTransaction);
router.post("/history/reset", authorize([UserRole.OWNER]), resetTransactionHistory);
router.get("/:id", getTransactionById);

export default router;
