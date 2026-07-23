import { Router } from "express";

import {
  createTransaction,
  getTransactionById,
  getTransactions
} from "../controllers/transaction.controller";

const router = Router();

router.get("/", getTransactions);
router.post("/", createTransaction);
router.get("/:id", getTransactionById);

export default router;
