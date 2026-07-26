import { Router } from "express";

import {
  exportSalesReportExcel,
  exportSalesReportPdf,
  getSalesReport
} from "../controllers/report.controller";

const router = Router();

router.get("/sales", getSalesReport);
router.get("/sales/export/excel", exportSalesReportExcel);
router.get("/sales/export/pdf", exportSalesReportPdf);

export default router;
