import { NextFunction, Request, Response } from "express";

import * as salesReportService from "../services/sales-report.service";
import type { SalesReportPeriod } from "../services/sales-report.service";

type SalesReportQuery = {
  period?: string;
  startDate?: string;
  endDate?: string;
};

const parseDate = (value: string | undefined) => {
  if (!value) return undefined;

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    throw new salesReportService.SalesReportValidationError(
      "Format tanggal tidak valid."
    );
  }

  return date;
};

const parseFilters = (query: SalesReportQuery) => {
  const period = query.period ?? "today";

  if (
    period !== "DAILY" &&
    period !== "WEEKLY" &&
    period !== "MONTHLY" &&
    period !== "YEARLY" &&
    period !== "CUSTOM" &&
    period !== "today" &&
    period !== "thisWeek" &&
    period !== "thisMonth" &&
    period !== "customDate"
  ) {
    throw new salesReportService.SalesReportValidationError(
      "Periode laporan tidak valid."
    );
  }

  const resolvedPeriod: SalesReportPeriod = period;

  return {
    period: resolvedPeriod,
    startDate: parseDate(query.startDate),
    endDate: parseDate(query.endDate)
  };
};

const handleSalesReportError = (
  error: unknown,
  res: Response,
  next: NextFunction,
  logMessage: string
) => {
  if (error instanceof salesReportService.SalesReportValidationError) {
    res.status(400).json({ success: false, message: error.message });
    return;
  }

  if (error instanceof salesReportService.SalesReportPdfError) {
    console.error(logMessage, error);
    res.status(500).json({ success: false, message: error.message });
    return;
  }

  console.error(logMessage, error);
  next(error);
};

const sendReportFile = (
  res: Response,
  file: Buffer,
  contentType: string,
  filename: string
) => {
  res.setHeader("Content-Type", contentType);
  res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);
  res.status(200).send(file);
};

export const getSalesReport = async (
  req: Request<unknown, unknown, unknown, SalesReportQuery>,
  res: Response,
  next: NextFunction
) => {
  try {
    const prisma = req.tenant.prisma;
    const report = await salesReportService.getSalesReport(
      prisma,
      parseFilters(req.query)
    );

    res.status(200).json({
      success: true,
      message: "Sales report retrieved successfully",
      data: report
    });
  } catch (error) {
    handleSalesReportError(
      error,
      res,
      next,
      "Unexpected error while retrieving sales report:"
    );
  }
};

export const exportSalesReportExcel = async (
  req: Request<unknown, unknown, unknown, SalesReportQuery>,
  res: Response,
  next: NextFunction
) => {
  try {
    const prisma = req.tenant.prisma;
    const file = await salesReportService.buildSalesReportExcel(
      prisma,
      parseFilters(req.query)
    );

    sendReportFile(
      res,
      file,
      "application/vnd.ms-excel; charset=utf-8",
      "sales-report.xls"
    );
  } catch (error) {
    handleSalesReportError(
      error,
      res,
      next,
      "Unexpected error while exporting sales report Excel:"
    );
  }
};

export const exportSalesReportPdf = async (
  req: Request<unknown, unknown, unknown, SalesReportQuery>,
  res: Response,
  next: NextFunction
) => {
  try {
    const prisma = req.tenant.prisma;
    const file = await salesReportService.buildSalesReportPdf(
      prisma,
      parseFilters(req.query)
    );

    res.download(file.path, "sales-report.pdf", (downloadError) => {
      void file.cleanup();

      if (downloadError) {
        console.error("Failed to send sales report PDF:", downloadError);
        if (!res.headersSent) next(downloadError);
      }
    });
  } catch (error) {
    handleSalesReportError(
      error,
      res,
      next,
      "Unexpected error while exporting sales report PDF:"
    );
  }
};
