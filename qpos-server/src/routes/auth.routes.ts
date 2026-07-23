import { Router } from "express";

import { login, logout, profile } from "../controllers/auth.controller";
import { authenticate } from "../middleware/auth.middleware";

const router = Router();

router.post("/login", login);
router.get("/profile", authenticate, profile);
router.post("/logout", authenticate, logout);

export default router;
