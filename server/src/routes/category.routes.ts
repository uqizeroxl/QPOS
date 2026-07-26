import { Router } from "express";

import {
  createCategory,
  deleteCategory,
  getAllCategories,
  updateCategory
} from "../controllers/category.controller";

const router = Router();

router.get("/", getAllCategories);
router.post("/", createCategory);
router.put("/:id", updateCategory);
router.delete("/:id", deleteCategory);

export default router;
