import { Router } from "express";

import { login, logout, profile, listStores, switchStore, googleLogin, appleLogin, completeRegistration, refresh } from "../controllers/auth.controller";
import { authenticate } from "../middleware/auth.middleware";
import { authLimiter } from "../middleware/rate-limiter.middleware";

const router = Router();

router.post("/login", authLimiter, login);
router.get("/profile", authenticate, profile);
router.post("/logout", authenticate, logout);
router.post("/refresh", refresh);
router.get("/stores", authenticate, listStores);
router.post("/switch-store", authenticate, switchStore);
router.post("/google", authLimiter, googleLogin);
router.post("/apple", authLimiter, appleLogin);
router.post("/complete-registration", authLimiter, completeRegistration);

export default router;
