import { Router } from "express";

import { login, logout, profile, listStores, switchStore, googleLogin, appleLogin, tiktokLogin, completeRegistration, refresh, acceptOwnership, accountInfo, bindGoogle, bindTikTok } from "../controllers/auth.controller";
import { authenticate } from "../middleware/auth.middleware";
import { authLimiter } from "../middleware/rate-limiter.middleware";

const router = Router();

router.post("/login", authLimiter, login);
router.get("/profile", authenticate, profile);
router.post("/logout", logout);
router.post("/refresh", refresh);
router.get("/stores", authenticate, listStores);
router.post("/accept-ownership", authenticate, acceptOwnership);
router.post("/switch-store", authenticate, switchStore);
router.get("/account", authenticate, accountInfo);
router.post("/bind-google", authenticate, bindGoogle);
router.post("/google", authLimiter, googleLogin);
router.post("/apple", authLimiter, appleLogin);
router.post("/tiktok", authLimiter, tiktokLogin);
router.post("/bind-tiktok", authenticate, bindTikTok);
router.post("/complete-registration", authLimiter, completeRegistration);

export default router;
