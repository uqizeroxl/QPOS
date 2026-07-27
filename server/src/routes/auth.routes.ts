import { Router } from "express";

import { login, logout, profile, listStores, switchStore, googleLogin, appleLogin } from "../controllers/auth.controller";
import { authenticate } from "../middleware/auth.middleware";

const router = Router();

router.post("/login", login);
router.get("/profile", authenticate, profile);
router.post("/logout", authenticate, logout);
router.get("/stores", authenticate, listStores);
router.post("/switch-store", authenticate, switchStore);
router.post("/google", googleLogin);
router.post("/apple", appleLogin);

export default router;
