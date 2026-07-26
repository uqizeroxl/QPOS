import { Prisma, PrismaClient } from "../generated/prisma/client";
import { execFile } from "node:child_process";
import { constants as fsConstants } from "node:fs";
import { access, mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";

export type SalesReportPeriod =
  | "DAILY"
  | "WEEKLY"
  | "MONTHLY"
  | "YEARLY"
  | "CUSTOM"
  | "today"
  | "thisWeek"
  | "thisMonth"
  | "customDate";

export type SalesReportFilters = {
  period: SalesReportPeriod;
  startDate?: Date;
  endDate?: Date;
};

export class SalesReportValidationError extends Error {}

export class SalesReportPdfError extends Error {
  readonly cause?: unknown;

  constructor(message: string, cause?: unknown) {
    super(message);
    this.name = "SalesReportPdfError";
    this.cause = cause;
  }
}

const toStartOfDay = (date: Date) => {
  const nextDate = new Date(date);
  nextDate.setHours(0, 0, 0, 0);
  return nextDate;
};

const toEndOfDay = (date: Date) => {
  const nextDate = new Date(date);
  nextDate.setHours(23, 59, 59, 999);
  return nextDate;
};

export const resolveSalesReportDateRange = (filters: SalesReportFilters) => {
  const now = new Date();

  if (filters.period === "CUSTOM" || filters.period === "customDate") {
    if (!filters.startDate || !filters.endDate) {
      throw new SalesReportValidationError(
        "startDate dan endDate wajib dikirim untuk customDate."
      );
    }

    const startDate = toStartOfDay(filters.startDate);
    const endDate = toEndOfDay(filters.endDate);

    if (startDate > endDate) {
      throw new SalesReportValidationError(
        "startDate tidak boleh lebih besar dari endDate."
      );
    }

    return { startDate, endDate };
  }

  if (filters.period === "WEEKLY" || filters.period === "thisWeek") {
    const startDate = toStartOfDay(now);
    const day = startDate.getDay();
    const distanceFromMonday = day === 0 ? 6 : day - 1;
    startDate.setDate(startDate.getDate() - distanceFromMonday);

    return { startDate, endDate: toEndOfDay(now) };
  }

  if (filters.period === "MONTHLY" || filters.period === "thisMonth") {
    return {
      startDate: new Date(now.getFullYear(), now.getMonth(), 1),
      endDate: toEndOfDay(now)
    };
  }

  if (filters.period === "YEARLY") {
    return {
      startDate: new Date(now.getFullYear(), 0, 1),
      endDate: toEndOfDay(now)
    };
  }

  return {
    startDate: toStartOfDay(now),
    endDate: toEndOfDay(now)
  };
};

export const getSalesReport = async (
  prisma: PrismaClient,
  filters: SalesReportFilters
) => {
  const { startDate, endDate } = resolveSalesReportDateRange(filters);
  const transactionWhere: Prisma.TransactionWhereInput = {
    createdAt: {
      gte: startDate,
      lte: endDate
    }
  };

  const [transactionSummary, transactions] =
    await prisma.$transaction([
      prisma.transaction.aggregate({
        where: transactionWhere,
        _count: {
          _all: true
        },
        _sum: {
          grandTotal: true
        }
      }),
      prisma.transaction.findMany({
        where: transactionWhere,
        orderBy: {
          createdAt: "desc"
        },
        select: {
          id: true,
          invoiceNumber: true,
          cashierName: true,
          grandTotal: true,
          createdAt: true,
          items: {
            select: {
              quantity: true,
              unitPrice: true,
              product: {
                select: {
                  sellingPrice: true,
                  purchasePrice: true
                }
              }
            }
          }
        }
      })
    ]);

  const getTransactionMetrics = (transaction: (typeof transactions)[number]) =>
    transaction.items.reduce(
      (totals, item) => {
        const quantity = item.quantity;
        const sellingPrice = Number(item.product?.sellingPrice ?? item.unitPrice);
        const purchasePrice = Number(item.product?.purchasePrice ?? 0);

        totals.itemsSold += quantity;
        totals.cost += purchasePrice * quantity;
        totals.profit += (sellingPrice - purchasePrice) * quantity;
        return totals;
      },
      { cost: 0, profit: 0, itemsSold: 0 }
    );

  const itemTotals = transactions.reduce(
    (totals, transaction) => {
      const metrics = getTransactionMetrics(transaction);
      totals.totalItemsSold += metrics.itemsSold;
      totals.totalCost += metrics.cost;
      totals.totalProfit += metrics.profit;

      return totals;
    },
    { totalCost: 0, totalProfit: 0, totalItemsSold: 0 }
  );
  const totalSales = Number(transactionSummary._sum.grandTotal ?? 0);
  const totalTransactions = transactionSummary._count._all;

  return {
    period: filters.period,
    startDate,
    endDate,
    summary: {
      totalSales,
      totalCost: itemTotals.totalCost,
      totalProfit: itemTotals.totalProfit,
      totalTransactions,
      totalItemsSold: itemTotals.totalItemsSold,
      averageTransaction:
        totalTransactions === 0 ? 0 : totalSales / totalTransactions,
      // Existing response keys remain available for current API consumers.
      revenue: totalSales,
      transactions: totalTransactions,
      itemsSold: itemTotals.totalItemsSold
    },
    transactions: transactions.map((transaction) => {
      const metrics = getTransactionMetrics(transaction);

      return {
        id: transaction.id,
        invoiceNumber: transaction.invoiceNumber,
        cashierName: transaction.cashierName,
        total: transaction.grandTotal,
        profit: metrics.profit,
        itemsSold: metrics.itemsSold,
        createdAt: transaction.createdAt
      };
    })
  };
};

const escapeHtml = (value: string) =>
  value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");

const formatDate = (date: Date) =>
  new Intl.DateTimeFormat("id-ID", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit"
  }).format(date);

export const buildSalesReportExcel = async (
  prisma: PrismaClient,
  filters: SalesReportFilters
) => {
  const report = await getSalesReport(prisma, filters);
  const rows = report.transactions
    .map(
      (transaction) => `
        <tr>
          <td>${escapeHtml(transaction.invoiceNumber)}</td>
          <td>${escapeHtml(formatDate(transaction.createdAt))}</td>
          <td>${escapeHtml(transaction.cashierName ?? "-")}</td>
          <td>${transaction.itemsSold}</td>
          <td>${transaction.total}</td>
        </tr>`
    )
    .join("");

  return Buffer.from(
    `<!doctype html>
    <html>
      <head><meta charset="utf-8" /></head>
      <body>
        <h1>Sales Report</h1>
        <p>Periode: ${escapeHtml(formatDate(report.startDate))} - ${escapeHtml(formatDate(report.endDate))}</p>
        <table border="1">
          <tr><th>Revenue</th><th>Transactions</th><th>Items Sold</th></tr>
          <tr><td>${report.summary.revenue}</td><td>${report.summary.transactions}</td><td>${report.summary.itemsSold}</td></tr>
        </table>
        <br />
        <table border="1">
          <tr><th>Invoice</th><th>Tanggal</th><th>Kasir</th><th>Items Sold</th><th>Total</th></tr>
          ${rows}
        </table>
      </body>
    </html>`,
    "utf8"
  );
};

type PythonCommand = { executable: string; prefixArgs: string[] };

const getPythonCommands = (): PythonCommand[] => {
  if (process.env.REPORTLAB_PYTHON) {
    return [{ executable: process.env.REPORTLAB_PYTHON, prefixArgs: [] }];
  }

  return process.platform === "win32"
    ? [
        { executable: "py", prefixArgs: ["-3"] },
        { executable: "python", prefixArgs: [] }
      ]
    : [
        { executable: "python3", prefixArgs: [] },
        { executable: "python", prefixArgs: [] }
      ];
};

const executePython = (
  command: PythonCommand,
  scriptPath: string,
  inputPath: string,
  outputPath: string
) =>
  new Promise<{ stdout: string; stderr: string }>((resolve, reject) => {
    execFile(
      command.executable,
      [...command.prefixArgs, scriptPath, inputPath, outputPath],
      { encoding: "utf8", maxBuffer: 2 * 1024 * 1024 },
      (error, stdout, stderr) => {
        if (error) {
          reject(Object.assign(error, { stdout, stderr }));
          return;
        }

        resolve({ stdout, stderr });
      }
    );
  });

const runReportLab = async (payload: unknown) => {
  const scriptPath = path.resolve(
    __dirname,
    "..",
    "..",
    "scripts",
    "generate-sales-report-pdf.py"
  );
  const temporaryDirectory = await mkdtemp(
    path.join(os.tmpdir(), "qpos-sales-report-")
  );
  const inputPath = path.join(temporaryDirectory, "report.json");
  const outputPath = path.join(temporaryDirectory, "sales-report.pdf");
  let retainTemporaryDirectory = false;

  try {
    await access(scriptPath, fsConstants.R_OK);
    await writeFile(inputPath, JSON.stringify(payload), "utf8");

    let lastError: unknown;
    for (const command of getPythonCommands()) {
      try {
        const result = await executePython(
          command,
          scriptPath,
          inputPath,
          outputPath
        );
        if (result.stdout || result.stderr) {
          console.info("ReportLab process output:", {
            executable: command.executable,
            stdout: result.stdout.trim(),
            stderr: result.stderr.trim()
          });
        }
        lastError = undefined;
        break;
      } catch (error) {
        lastError = error;
        const processError = error as NodeJS.ErrnoException & {
          stdout?: string;
          stderr?: string;
        };
        console.error("ReportLab process failed:", {
          executable: command.executable,
          scriptPath,
          inputPath,
          outputPath,
          code: processError.code,
          message: processError.message,
          stdout: processError.stdout?.trim() ?? "",
          stderr: processError.stderr?.trim() ?? ""
        });

      }
    }

    if (lastError) {
      throw new SalesReportPdfError(
        "PDF laporan gagal dibuat oleh ReportLab. Periksa instalasi Python dan ReportLab.",
        lastError
      );
    }

    await access(outputPath, fsConstants.R_OK);
    const pdfHeader = (await readFile(outputPath)).subarray(0, 5);
    if (pdfHeader.length < 5 || pdfHeader.toString("ascii") !== "%PDF-") {
      throw new SalesReportPdfError(
        "ReportLab tidak menghasilkan file PDF yang valid."
      );
    }

    retainTemporaryDirectory = true;
    return {
      path: outputPath,
      cleanup: () =>
        rm(temporaryDirectory, { recursive: true, force: true }).catch(
          (cleanupError) => {
            console.error("Failed to clean up PDF report temporary files:", {
              temporaryDirectory,
              cleanupError
            });
          }
        )
    };
  } catch (error) {
    if (error instanceof SalesReportPdfError) throw error;

    console.error("PDF report file handling failed:", {
      scriptPath,
      inputPath,
      outputPath,
      error
    });
    throw new SalesReportPdfError(
      "PDF laporan gagal dibuat atau file hasil tidak ditemukan.",
      error
    );
  } finally {
    if (!retainTemporaryDirectory) {
      await rm(temporaryDirectory, { recursive: true, force: true }).catch(
        (cleanupError) => {
          console.error("Failed to clean up PDF report temporary files:", {
            temporaryDirectory,
            cleanupError
          });
        }
      );
    }
  }
};

export const buildSalesReportPdf = async (
  prisma: PrismaClient,
  filters: SalesReportFilters
) => {
  const report = await getSalesReport(prisma, filters);
  const printedAt = new Date();

  return runReportLab({
    period: `${formatDate(report.startDate)} - ${formatDate(report.endDate)}`,
    printedAt: formatDate(printedAt),
    summary: report.summary,
    transactions: report.transactions.map((transaction) => ({
      ...transaction,
      total: Number(transaction.total),
      createdAt: formatDate(transaction.createdAt)
    }))
  });
};
