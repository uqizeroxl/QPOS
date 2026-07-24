import { NextFunction, Request, Response } from "express";

import * as productService from "../services/product.service";
import * as barcodeGeneratorService from "../services/barcode-generator.service";
import {
  RecordStatus,
  StockAdjustmentType,
  StockReferenceType
} from "../generated/prisma/client";
import type { AuthenticatedRequest } from "../middleware/auth.middleware";

type CreateProductRequestBody = {
  barcode?: string;
  name?: string;
  purchasePrice?: number | string | null;
  sellingPrice?: number | string;
  stock?: number | string;
  status?: string;
  categoryId?: string;
  category?: string;
  supplierId?: string | null;
};

type ProductParams = {
  id: string;
};

type BulkDeleteProductsRequestBody = {
  productIds?: unknown;
};

type BulkUpdateProductsRequestBody = {
  products?: Array<{
    id?: unknown;
    name?: unknown;
    barcode?: unknown;
    purchasePrice?: unknown;
    sellingPrice?: unknown;
  }>;
};

type AdjustStockRequestBody = {
  type?: string;
  quantity?: number | string;
  note?: string;
};

type RestockProductsRequestBody = {
  items?: Array<{
    productId?: string;
    quantity?: number | string;
    purchasePrice?: number | string;
    sellingPrice?: number | string;
  }>;
};

type StockHistoryQuery = {
  page?: string;
  limit?: string;
  productId?: string;
  type?: string;
  startDate?: string;
  endDate?: string;
};

type ProductListQuery = {
  page?: string;
  limit?: string;
  search?: string;
  category?: string;
};

type RestockProductSearchQuery = {
  keyword?: string;
};

type CashierProductSearchQuery = {
  keyword?: string;
};

const parsePositiveInteger = (value: string | undefined, fallback: number) => {
  const parsedValue = Number(value ?? fallback);
  return Number.isInteger(parsedValue) && parsedValue > 0
    ? Math.min(parsedValue, 100)
    : fallback;
};

const parseProductLimit = (value: string | undefined) => {
  const parsedValue = Number(value ?? 100);
  return Number.isInteger(parsedValue) && parsedValue > 0
    ? Math.min(parsedValue, 500)
    : 100;
};

const parseProductPage = (value: string | undefined) => {
  const parsedValue = Number(value ?? 1);
  return Number.isInteger(parsedValue) && parsedValue > 0 ? parsedValue : 1;
};

const parseDate = (value: string | undefined, endOfDay = false) => {
  if (!value) return undefined;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return undefined;
  if (endOfDay) date.setHours(23, 59, 59, 999);
  return date;
};

const parseProductStatus = (status?: string) => {
  if (!status || status === "Aktif" || status === "ACTIVE") {
    return RecordStatus.ACTIVE;
  }

  if (status === "Nonaktif" || status === "INACTIVE") {
    return RecordStatus.INACTIVE;
  }

  return null;
};

const parseStockAdjustmentType = (type?: string) => {
  if (type === "ADD" || type === "Add") {
    return StockAdjustmentType.ADD;
  }

  if (type === "REDUCE" || type === "Reduce") {
    return StockAdjustmentType.REDUCE;
  }

  if (type === "SET" || type === "Set") {
    return StockAdjustmentType.SET;
  }

  return null;
};

export const getAllProducts = async (
  req: AuthenticatedRequest & Request<unknown, unknown, unknown, ProductListQuery>,
  res: Response,
  next: NextFunction
) => {
  try {
    const prisma = req.tenant.prisma;
    const page = parseProductPage(req.query.page);
    const limit = parseProductLimit(req.query.limit);
    const { products, total } = await productService.getAllProducts(prisma, {
      page,
      limit,
      search: req.query.search?.trim() || undefined,
      category: req.query.category?.trim() || undefined
    });

    res.status(200).json({
      success: true,
      message: "Products retrieved successfully",
      data: products,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit)
    });
  } catch (error) {
    next(error);
  }
};

export const searchRestockProducts = async (
  req: AuthenticatedRequest & Request<unknown, unknown, unknown, RestockProductSearchQuery>,
  res: Response,
  next: NextFunction
) => {
  try {
    const keyword = req.query.keyword?.trim() ?? "";

    if (!keyword) {
      res.status(400).json({
        success: false,
        message: "Keyword pencarian wajib diisi."
      });
      return;
    }

    const products = await productService.searchRestockProducts(
      req.tenant.prisma,
      keyword
    );

    res.status(200).json({
      success: true,
      message: "Produk restok berhasil dicari.",
      data: products
    });
  } catch (error) {
    next(error);
  }
};

export const searchCashierProducts = async (
  req: AuthenticatedRequest & Request<unknown, unknown, unknown, CashierProductSearchQuery>,
  res: Response,
  next: NextFunction
) => {
  try {
    const keyword = req.query.keyword?.trim() ?? "";

    // Temporary diagnostic logging for cashier product-search verification.
    console.info("[cashier-product-search] keyword:", keyword);

    if (!keyword) {
      res.status(400).json({
        success: false,
        message: "Keyword pencarian wajib diisi."
      });
      return;
    }

    const products = await productService.searchCashierProducts(
      req.tenant.prisma,
      keyword
    );

    console.info("[cashier-product-search] results:", {
      count: products.length,
      products: products.map((product) => ({
        id: product.id,
        name: product.name
      }))
    });

    res.status(200).json({
      success: true,
      message: "Produk kasir berhasil dicari.",
      data: products
    });
  } catch (error) {
    next(error);
  }
};

export const generateProductBarcode = async (
  req: AuthenticatedRequest & Request<ProductParams>,
  res: Response,
  next: NextFunction
) => {
  try {
    const product = await barcodeGeneratorService.generateProductBarcode(
      req.tenant.prisma,
      req.params.id
    );

    res.status(200).json({
      success: true,
      message: "Barcode generated successfully",
      data: product
    });
  } catch (error) {
    if (error instanceof barcodeGeneratorService.BarcodeProductNotFoundError) {
      res.status(404).json({ success: false, message: error.message });
      return;
    }

    if (error instanceof barcodeGeneratorService.BarcodeGenerationFailedError) {
      res.status(409).json({ success: false, message: error.message });
      return;
    }

    next(error);
  }
};

export const createProduct = async (
  req: AuthenticatedRequest & Request<unknown, unknown, CreateProductRequestBody>,
  res: Response,
  next: NextFunction
) => {
  try {
    const prisma = req.tenant.prisma;
    const barcode = req.body.barcode?.trim() || null;
    const name = req.body.name?.trim();
    const categoryId = req.body.categoryId?.trim();
    const supplierId = req.body.supplierId?.trim() || null;
    const purchasePrice =
      req.body.purchasePrice === undefined ||
      req.body.purchasePrice === null ||
      req.body.purchasePrice === ""
        ? null
        : Number(req.body.purchasePrice);
    const sellingPrice = Number(req.body.sellingPrice ?? 0);
    const stock =
      req.body.stock === undefined ? undefined : Number(req.body.stock);
    const status = parseProductStatus(req.body.status?.trim());

    if (!name) {
      res.status(400).json({
        success: false,
        message: "Product name is required"
      });
      return;
    }

    if (purchasePrice !== null && (Number.isNaN(purchasePrice) || purchasePrice < 0)) {
      res.status(400).json({
        success: false,
        message: "Purchase price must be greater than or equal to 0"
      });
      return;
    }

    if (Number.isNaN(sellingPrice) || sellingPrice < 0) {
      res.status(400).json({
        success: false,
        message: "Selling price must be greater than or equal to 0"
      });
      return;
    }

    if (stock !== undefined && (Number.isNaN(stock) || stock < 0)) {
      res.status(400).json({
        success: false,
        message: "Stock must be greater than or equal to 0"
      });
      return;
    }

    if (!status) {
      res.status(400).json({
        success: false,
        message: "Product status is invalid"
      });
      return;
    }

    if (!categoryId) {
      res.status(400).json({
        success: false,
        message: "Kategori wajib dipilih."
      });
      return;
    }

    const product = await productService.createProduct(
      prisma,
      {
        barcode,
        name,
        purchasePrice,
        sellingPrice,
        stock,
        status,
        categoryId,
        supplierId
      },
      req.user.name
    );

    res.status(201).json({
      success: true,
      message: "Product created successfully",
      data: product
    });
  } catch (error) {
    if (error instanceof productService.BarcodeAlreadyExistsError) {
      res.status(409).json({
        success: false,
        message: "Barcode sudah digunakan."
      });
      return;
    }

    if (error instanceof productService.CategoryRequiredError) {
      res.status(400).json({
        success: false,
        message: "Kategori wajib dipilih."
      });
      return;
    }

    if (error instanceof productService.CategoryNotFoundError) {
      res.status(404).json({
        success: false,
        message: "Kategori tidak ditemukan."
      });
      return;
    }

    if (error instanceof productService.InvalidProductDataError) {
      res.status(400).json({
        success: false,
        message: error.message
      });
      return;
    }

    console.error("Unexpected error while creating product:", error);
    next(error);
  }
};

export const updateProduct = async (
  req: AuthenticatedRequest & Request<ProductParams, unknown, CreateProductRequestBody>,
  res: Response,
  next: NextFunction
) => {
  try {
    const prisma = req.tenant.prisma;
    const barcode = req.body.barcode?.trim() || null;
    const name = req.body.name?.trim();
    const categoryId = req.body.categoryId?.trim();
    const supplierId = req.body.supplierId?.trim() || null;
    const purchasePrice =
      req.body.purchasePrice === undefined ||
      req.body.purchasePrice === null ||
      req.body.purchasePrice === ""
        ? null
        : Number(req.body.purchasePrice);
    const sellingPrice = Number(req.body.sellingPrice ?? 0);
    const stock =
      req.body.stock === undefined ? undefined : Number(req.body.stock);
    const status = parseProductStatus(req.body.status?.trim());

    if (!name) {
      res.status(400).json({
        success: false,
        message: "Product name is required"
      });
      return;
    }

    if (purchasePrice !== null && (Number.isNaN(purchasePrice) || purchasePrice < 0)) {
      res.status(400).json({
        success: false,
        message: "Purchase price must be greater than or equal to 0"
      });
      return;
    }

    if (Number.isNaN(sellingPrice) || sellingPrice < 0) {
      res.status(400).json({
        success: false,
        message: "Selling price must be greater than or equal to 0"
      });
      return;
    }

    if (stock !== undefined && (Number.isNaN(stock) || stock < 0)) {
      res.status(400).json({
        success: false,
        message: "Stock must be greater than or equal to 0"
      });
      return;
    }

    if (!status) {
      res.status(400).json({
        success: false,
        message: "Product status is invalid"
      });
      return;
    }

    if (!categoryId) {
      res.status(400).json({
        success: false,
        message: "Kategori wajib dipilih."
      });
      return;
    }

    const product = await productService.updateProduct(
      prisma,
      req.params.id,
      {
        barcode,
        name,
        purchasePrice,
        sellingPrice,
        stock,
        status,
        categoryId,
        supplierId
      },
      req.user.name
    );

    res.status(200).json({
      success: true,
      message: "Product updated successfully",
      data: product
    });
  } catch (error) {
    if (error instanceof productService.ProductNotFoundError) {
      res.status(404).json({
        success: false,
        message: "Produk tidak ditemukan."
      });
      return;
    }

    if (error instanceof productService.BarcodeAlreadyExistsError) {
      res.status(409).json({
        success: false,
        message: "Barcode sudah digunakan."
      });
      return;
    }

    if (error instanceof productService.CategoryRequiredError) {
      res.status(400).json({
        success: false,
        message: "Kategori wajib dipilih."
      });
      return;
    }

    if (error instanceof productService.CategoryNotFoundError) {
      res.status(404).json({
        success: false,
        message: "Kategori tidak ditemukan."
      });
      return;
    }

    if (error instanceof productService.InvalidProductDataError) {
      res.status(400).json({
        success: false,
        message: error.message
      });
      return;
    }

    console.error("Unexpected error while updating product:", error);
    next(error);
  }
};

export const deleteProduct = async (
  req: AuthenticatedRequest & Request<ProductParams>,
  res: Response,
  next: NextFunction
) => {
  try {
    const prisma = req.tenant.prisma;
    const product = await productService.deleteProduct(
      prisma,
      req.params.id
    );

    res.status(200).json({
      success: true,
      message: "Product deleted successfully",
      data: product
    });
  } catch (error) {
    if (error instanceof productService.ProductNotFoundError) {
      res.status(404).json({
        success: false,
        message: "Produk tidak ditemukan."
      });
      return;
    }

    console.error("Unexpected error while deleting product:", error);
    next(error);
  }
};

export const bulkDeleteProducts = async (
  req: AuthenticatedRequest & Request<unknown, unknown, BulkDeleteProductsRequestBody>,
  res: Response,
  next: NextFunction
) => {
  try {
    const productIds = Array.isArray(req.body.productIds)
      ? req.body.productIds.filter(
          (id: unknown): id is string => typeof id === "string"
        )
      : [];
    const result = await productService.bulkDeleteProducts(
      req.tenant.prisma,
      productIds
    );

    res.status(200).json({
      success: true,
      message: `${result.deletedCount} produk berhasil dihapus.`,
      data: result
    });
  } catch (error) {
    if (error instanceof productService.InvalidProductSelectionError) {
      res.status(400).json({ success: false, message: error.message });
      return;
    }
    if (error instanceof productService.ProductNotFoundError) {
      res.status(404).json({
        success: false,
        message: "Satu atau lebih produk tidak ditemukan. Tidak ada produk yang dihapus."
      });
      return;
    }
    if (error instanceof productService.ProductDeleteConflictError) {
      res.status(409).json({ success: false, message: error.message });
      return;
    }

    console.error("Unexpected error while bulk deleting products:", error);
    next(error);
  }
};

export const bulkUpdateProducts = async (
  req: AuthenticatedRequest & Request<unknown, unknown, BulkUpdateProductsRequestBody>,
  res: Response,
  next: NextFunction
) => {
  try {
    const products = (req.body.products ?? []).map((item: NonNullable<BulkUpdateProductsRequestBody["products"]>[number]) => ({
      id: typeof item.id === "string" ? item.id : "",
      name: typeof item.name === "string" ? item.name : "",
      barcode: typeof item.barcode === "string" ? item.barcode : null,
      purchasePrice: item.purchasePrice === null || item.purchasePrice === "" ? null : Number(item.purchasePrice),
      sellingPrice: Number(item.sellingPrice)
    }));
    const result = await productService.bulkUpdateProducts(req.tenant.prisma, products);
    res.status(200).json({ success: true, message: `${result.updatedCount} produk berhasil diperbarui.`, data: result });
  } catch (error) {
    if (error instanceof productService.InvalidProductDataError) {
      res.status(400).json({ success: false, message: error.message });
      return;
    }
    if (error instanceof productService.BarcodeAlreadyExistsError) {
      res.status(409).json({ success: false, message: "Barcode tidak boleh duplikat." });
      return;
    }
    if (error instanceof productService.ProductNotFoundError) {
      res.status(404).json({ success: false, message: "Satu atau lebih produk tidak ditemukan. Tidak ada produk yang diperbarui." });
      return;
    }
    console.error("Unexpected error while bulk updating products:", error);
    next(error);
  }
};

export const adjustProductStock = async (
  req: AuthenticatedRequest & Request<ProductParams, unknown, AdjustStockRequestBody>,
  res: Response,
  next: NextFunction
) => {
  try {
    const prisma = req.tenant.prisma;
    const type = parseStockAdjustmentType(req.body.type);
    const quantity = Number(req.body.quantity);
    const note = req.body.note?.trim() ?? "";

    if (!type) {
      res.status(400).json({
        success: false,
        message: "Stock adjustment type is invalid"
      });
      return;
    }

    if (!Number.isInteger(quantity) || quantity < 0) {
      res.status(400).json({
        success: false,
        message: "Quantity must be greater than or equal to 0"
      });
      return;
    }

    const result = await productService.adjustProductStock(
      prisma,
      req.params.id,
      {
        type,
        quantity,
        note
      },
      req.user.name
    );

    res.status(200).json({
      success: true,
      message: "Stock adjusted successfully",
      data: result
    });
  } catch (error) {
    if (error instanceof productService.ProductNotFoundError) {
      res.status(404).json({
        success: false,
        message: "Produk tidak ditemukan."
      });
      return;
    }

    if (error instanceof productService.InvalidStockAdjustmentError) {
      res.status(400).json({
        success: false,
        message: error.message
      });
      return;
    }

    console.error("Unexpected error while adjusting product stock:", error);
    next(error);
  }
};

export const getProductStockHistory = async (
  req: AuthenticatedRequest & Request<ProductParams>,
  res: Response,
  next: NextFunction
) => {
  try {
    const prisma = req.tenant.prisma;
    const history = await productService.getProductStockHistory(
      prisma,
      req.params.id
    );

    res.status(200).json({
      success: true,
      message: "Stock history retrieved successfully",
      data: history
    });
  } catch (error) {
    if (error instanceof productService.ProductNotFoundError) {
      res.status(404).json({
        success: false,
        message: "Produk tidak ditemukan."
      });
      return;
    }

    console.error("Unexpected error while retrieving stock history:", error);
    next(error);
  }
};

export const getStockHistories = async (
  req: AuthenticatedRequest & Request<unknown, unknown, unknown, StockHistoryQuery>,
  res: Response,
  next: NextFunction
) => {
  try {
    const prisma = req.tenant.prisma;
    const referenceType = Object.values(StockReferenceType).includes(
      req.query.type as StockReferenceType
    )
      ? (req.query.type as StockReferenceType)
      : undefined;
    const histories = await productService.getStockHistories(prisma, {
      page: parsePositiveInteger(req.query.page, 1),
      limit: parsePositiveInteger(req.query.limit, 10),
      productId: req.query.productId?.trim() || undefined,
      referenceType,
      startDate: parseDate(req.query.startDate),
      endDate: parseDate(req.query.endDate, true)
    });

    res.status(200).json(histories);
  } catch (error) {
    console.error("Unexpected error while retrieving stock histories:", error);
    next(error);
  }
};

export const restockProducts = async (
  req: AuthenticatedRequest & Request<unknown, unknown, RestockProductsRequestBody>,
  res: Response,
  next: NextFunction
) => {
  try {
    const prisma = req.tenant.prisma;
    const body = req.body as RestockProductsRequestBody;
    const items = Array.isArray(body.items)
      ? body.items.map((item) => ({
          productId: item.productId?.trim() ?? "",
          quantity: Number(item.quantity),
          purchasePrice: Number(item.purchasePrice),
          sellingPrice: Number(item.sellingPrice)
        }))
      : [];

    const result = await productService.restockProducts(
      prisma,
      items,
      req.user.name
    );

    res.status(200).json({
      success: true,
      message: "Restok barang berhasil.",
      data: result
    });
  } catch (error) {
    if (error instanceof productService.ProductNotFoundError) {
      res.status(404).json({
        success: false,
        message: "Salah satu produk tidak ditemukan atau sudah tidak aktif."
      });
      return;
    }

    if (error instanceof productService.InvalidRestockDataError) {
      res.status(400).json({
        success: false,
        message: error.message
      });
      return;
    }

    console.error("Unexpected error while restocking products:", error);
    next(error);
  }
};

export const exportProductDataset = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const prisma = req.tenant.prisma;
    const file = await productService.exportProductDataset(prisma);
    const today = new Date().toISOString().slice(0, 10);

    res.setHeader(
      "Content-Type",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    );
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="dataset_produk_${today}.xlsx"`
    );
    res.status(200).send(Buffer.from(file));
  } catch (error) {
    console.error("Unexpected error while exporting product dataset:", error);
    next(error);
  }
};

export const previewProductDatasetImport = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const prisma = req.tenant.prisma;
    if (!req.file) {
      res.status(400).json({
        success: false,
        message: "File dataset produk wajib dipilih."
      });
      return;
    }

    const preview = await productService.previewProductDatasetImport(
      prisma,
      req.file.buffer
    );

    res.status(200).json({
      success: true,
      message: "Preview import dataset produk berhasil.",
      data: preview
    });
  } catch (error) {
    if (error instanceof productService.ProductDatasetValidationError) {
      res.status(400).json({
        success: false,
        message: error.message
      });
      return;
    }

    console.error("Unexpected error while previewing product dataset:", error);
    next(error);
  }
};

export const importProductDataset = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const prisma = req.tenant.prisma;
    if (!req.file) {
      res.status(400).json({
        success: false,
        message: "File dataset produk wajib dipilih."
      });
      return;
    }

    const result = await productService.importProductDataset(
      prisma,
      req.file.buffer,
      req.user.name
    );

    res.status(200).json({
      success: true,
      message: "Import dataset produk selesai.",
      data: result
    });
  } catch (error) {
    if (error instanceof productService.ProductDatasetValidationError) {
      res.status(400).json({
        success: false,
        message: error.message
      });
      return;
    }

    console.error("Unexpected error while importing product dataset:", error);
    next(error);
  }
};
