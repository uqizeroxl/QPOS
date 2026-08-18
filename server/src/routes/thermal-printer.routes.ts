import { Router } from "express";

import { printReceipt } from "../controllers/thermal-printer.controller";
import { UserRole } from "../generated/prisma/client";
import { authorize } from "../middleware/auth.middleware";

const router = Router();

router.post("/receipt", authorize([UserRole.OWNER, UserRole.ADMIN, UserRole.CASHIER]), printReceipt);

export default router;
