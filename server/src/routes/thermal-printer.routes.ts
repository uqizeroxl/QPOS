import { Router } from "express";

import { printReceipt, testConnection } from "../controllers/thermal-printer.controller";
import { UserRole } from "../generated/prisma/client";
import { authorize } from "../middleware/auth.middleware";

const router = Router();

router.post("/receipt", authorize([UserRole.OWNER, UserRole.ADMIN, UserRole.CASHIER]), printReceipt);
router.post("/test-connection", authorize([UserRole.OWNER, UserRole.ADMIN, UserRole.CASHIER]), testConnection);

export default router;
