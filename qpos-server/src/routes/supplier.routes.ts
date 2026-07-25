import { Router } from "express";

import {
  createSupplier,
  deleteSupplier,
  getAllSuppliers,
  updateSupplier
} from "../controllers/supplier.controller";

const router = Router();

router.get("/", getAllSuppliers);
router.post("/", createSupplier);
router.put("/:id", updateSupplier);
router.delete("/:id", deleteSupplier);

export default router;
