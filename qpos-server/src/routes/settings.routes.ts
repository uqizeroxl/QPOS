import { Router } from "express";

import { resetProductDataset } from "../controllers/settings.controller";

const router = Router();

router.post("/product-dataset/reset", resetProductDataset);

export default router;
