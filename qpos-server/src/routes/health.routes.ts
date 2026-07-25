import { Router } from "express";

import { getApiStatus } from "../controllers/health.controller";

const router = Router();

router.get("/", getApiStatus);

export default router;
