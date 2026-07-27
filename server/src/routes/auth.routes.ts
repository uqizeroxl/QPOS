import { Router } from "express";

import { login, logout, profile, listStores, switchStore } from "../controllers/auth.controller";
import { authenticate } from "../middleware/auth.middleware";

const router = Router();

router.post("/login", login);
router.get("/profile", authenticate, profile);
router.post("/logout", authenticate, logout);
router.get("/stores", authenticate, listStores);
router.post("/switch-store", authenticate, switchStore);

export default router;
