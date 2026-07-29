import ExcelJS from "exceljs";

import {
  ActivityType,
  Prisma,
  PrismaClient,
  RecordStatus,
  StockAdjustmentType,
  StockReferenceType
} from "../generated/prisma/client";
import { trimAndStrip } from "../utils/escape";

export type CreateProductInput = {
  barcode?: string | null;
  name: string;
  purchasePrice?: number | null;
  sellingPrice: number;
  stock?: number;
  minimumStock?: number;
  status?: RecordStatus;
  categoryId?: string;
  supplierId?: string | null;
};

export type UpdateProductInput = CreateProductInput;

export type BulkUpdateProductInput = {
  id: string;
  name: string;
  barcode: string | null;
  purchasePrice: number | null;
  sellingPrice: number;
};

export type AdjustStockInput = {
  type: StockAdjustmentType;
  quantity: number;
  note?: string;
};

export type RestockProductInput = {
  productId: string;
  quantity: number;
  purchasePrice: number;
  sellingPrice: number;
};

export type GetStockHistoriesInput = {
  page: number;
  limit: number;
  productId?: string;
  referenceType?: StockReferenceType;
  startDate?: Date;
  endDate?: Date;
};

export class BarcodeAlreadyExistsError extends Error {
  constructor() {
    super("Barcode already exists");
  }
}

export class ProductNotFoundError extends Error {
  constructor() {
    super("Product not found");
  }
}

export class ProductDeleteConflictError extends Error {}

export class InvalidProductSelectionError extends Error {}

export class CategoryRequiredError extends Error {
  constructor() {
    super("Category is required");
  }
}

export class CategoryNotFoundError extends Error {
  constructor() {
    super("Category not found");
  }
}

export class InvalidProductDataError extends Error {
  constructor(message = "Invalid product data") {
    super(message);
  }
}

export class InvalidStockAdjustmentError extends Error {
  constructor(message = "Invalid stock adjustment") {
    super(message);
  }
}

export class InvalidRestockDataError extends Error {
  constructor(message = "Invalid restock data") {
    super(message);
  }
}

export class ProductDatasetValidationError extends Error {}

export type ProductDatasetPreview = {
  totalData: number;
  newProducts: number;
  duplicateBarcodes: number;
};

export type ProductDatasetImportResult = {
  inserted: number;
  updated: number;
  skippedDuplicateRows: number;
  failed: number;
};

type ProductDatasetRow = {
  barcode: string | null;
  name: string;
  categoryName: string;
  supplierName: string;
  purchasePrice: number;
  sellingPrice: number;
  stock: number;
  minimumStock: number | null;
  status: RecordStatus;
};

const productDatasetHeaders = [
  "Barcode",
  "Nama Produk",
  "Kategori",
  "Supplier",
  "Harga Beli",
  "Harga Jual",
  "Stok",
  "Minimum Stock",
  "Status"
] as const;

const getCategoryId = async (
  prisma: PrismaClient,
  data: CreateProductInput
) => {
  if (data.categoryId) {
    const category = await prisma.category.findFirst({
      where: {
        id: data.categoryId,
        status: RecordStatus.ACTIVE
      },
      select: {
        id: true
      }
    });

    if (!category) {
      throw new CategoryNotFoundError();
    }

    return category.id;
  }

  throw new CategoryRequiredError();
};

export const getAllProducts = async (
  prisma: PrismaClient,
  pagination: {
    page: number;
    limit: number;
    search?: string;
    category?: string;
  } = { page: 1, limit: 100 }
) => {
  const where: Prisma.ProductWhereInput = {
    status: RecordStatus.ACTIVE,
    ...(pagination.search
      ? {
          OR: [
            { name: { contains: pagination.search, mode: "insensitive" } },
            { barcode: { contains: pagination.search, mode: "insensitive" } }
          ]
        }
      : {}),
    ...(pagination.category
      ? { category: { name: pagination.category } }
      : {})
  };
  const [products, total] = await prisma.$transaction([
    prisma.product.findMany({
      where,
      include: {
        category: true
      },
      orderBy: {
        createdAt: "desc"
      },
      skip: (pagination.page - 1) * pagination.limit,
      take: pagination.limit
    }),
    prisma.product.count({ where })
  ]);

  return { products, total };
};

export const searchRestockProducts = async (
  prisma: PrismaClient,
  keyword: string
) => {
  const normalizedKeyword = keyword.trim();

  if (!normalizedKeyword) {
    return [];
  }

  const barcodeProduct = await prisma.product.findFirst({
    where: {
      barcode: normalizedKeyword,
      status: RecordStatus.ACTIVE
    },
    include: {
      category: true
    }
  });

  if (barcodeProduct) {
    return [barcodeProduct];
  }

  return prisma.product.findMany({
    where: {
      name: {
        contains: normalizedKeyword,
        mode: "insensitive"
      },
      status: RecordStatus.ACTIVE
    },
    include: {
      category: true
    },
    orderBy: {
      name: "asc"
    },
    take: 8
  });
};

export const searchCashierProducts = async (
  prisma: PrismaClient,
  keyword: string
) => {
  const normalizedKeyword = keyword.trim();

  if (!normalizedKeyword) {
    return [];
  }

  const barcodeProduct = await prisma.product.findFirst({
    where: {
      barcode: normalizedKeyword,
      status: RecordStatus.ACTIVE
    },
    include: {
      category: true
    }
  });

  if (barcodeProduct) {
    return [barcodeProduct];
  }

  return prisma.product.findMany({
    where: {
      name: {
        contains: normalizedKeyword,
        mode: "insensitive"
      },
      status: RecordStatus.ACTIVE
    },
    include: {
      category: true
    },
    orderBy: {
      name: "asc"
    }
  });
};

export const createProduct = async (
  prisma: PrismaClient,
  data: CreateProductInput,
  userName?: string
) => {
  const sanitizedData = {
    ...data,
    name: trimAndStrip(data.name),
    barcode: data.barcode ? trimAndStrip(data.barcode) : null,
  };
  const categoryId = await getCategoryId(prisma, sanitizedData);

  const existingProduct = sanitizedData.barcode
    ? await prisma.product.findUnique({
        where: {
          barcode: sanitizedData.barcode
        }
      })
    : null;

  if (existingProduct) {
    throw new BarcodeAlreadyExistsError();
  }

  try {
    return await prisma.$transaction(async (tx) => {
      const product = await tx.product.create({
        data: {
          barcode: sanitizedData.barcode,
          name: sanitizedData.name,
          purchasePrice: sanitizedData.purchasePrice,
          sellingPrice: sanitizedData.sellingPrice,
          stock: sanitizedData.stock,
          minimumStock: sanitizedData.minimumStock,
          status: sanitizedData.status,
          categoryId,
          supplierId: sanitizedData.supplierId
        },
        include: {
          category: true
        }
      });

      if (product.stock !== 0) {
        await tx.stockHistory.create({
          data: {
            productId: product.id,
            type: StockAdjustmentType.SET,
            quantity: product.stock,
            previousStock: 0,
            currentStock: product.stock,
            referenceType: StockReferenceType.ADJUSTMENT,
            referenceId: product.id,
            userName,
            note: "Stok awal produk"
          }
        });
      }

      return product;
    });
  } catch (error) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2002"
    ) {
      throw new BarcodeAlreadyExistsError();
    }

    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2003"
    ) {
      throw new InvalidProductDataError("Invalid product reference");
    }

    if (error instanceof Prisma.PrismaClientValidationError) {
      throw new InvalidProductDataError(error.message);
    }

    throw error;
  }
};

export const updateProduct = async (
  prisma: PrismaClient,
  productId: string,
  data: UpdateProductInput,
  userName?: string
) => {
  const sanitizedData = {
    ...data,
    name: trimAndStrip(data.name),
    barcode: data.barcode ? trimAndStrip(data.barcode) : null,
  };
  const categoryId = await getCategoryId(prisma, sanitizedData);

  const currentProduct = await prisma.product.findUnique({
    where: {
      id: productId
    }
  });

  if (!currentProduct) {
    throw new ProductNotFoundError();
  }

  const existingProduct = sanitizedData.barcode
    ? await prisma.product.findFirst({
        where: {
          barcode: sanitizedData.barcode,
          id: {
            not: productId
          }
        }
      })
    : null;

  if (existingProduct) {
    throw new BarcodeAlreadyExistsError();
  }

  try {
    return await prisma.$transaction(async (tx) => {
      const product = await tx.product.update({
        where: {
          id: productId
        },
        data: {
          barcode: sanitizedData.barcode,
          name: sanitizedData.name,
          purchasePrice: data.purchasePrice,
          sellingPrice: data.sellingPrice,
          stock: data.stock,
          minimumStock: data.minimumStock,
          status: data.status,
          categoryId,
          supplierId: data.supplierId
        },
        include: {
          category: true
        }
      });

      if (product.stock !== currentProduct.stock) {
        await tx.stockHistory.create({
          data: {
            productId,
            type: StockAdjustmentType.SET,
            quantity: Math.abs(product.stock - currentProduct.stock),
            previousStock: currentProduct.stock,
            currentStock: product.stock,
            referenceType: StockReferenceType.ADJUSTMENT,
            referenceId: productId,
            userName,
            note: "Stok diubah melalui edit produk"
          }
        });
      }

      return product;
    });
  } catch (error) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2002"
    ) {
      throw new BarcodeAlreadyExistsError();
    }

    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2003"
    ) {
      throw new InvalidProductDataError("Invalid product reference");
    }

    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2025"
    ) {
      throw new ProductNotFoundError();
    }

    if (error instanceof Prisma.PrismaClientValidationError) {
      throw new InvalidProductDataError(error.message);
    }

    throw error;
  }
};

export const deleteProduct = async (
  prisma: PrismaClient,
  productId: string
) => {
  const currentProduct = await prisma.product.findUnique({
    where: {
      id: productId
    },
    include: {
      category: true
    }
  });

  if (!currentProduct) {
    throw new ProductNotFoundError();
  }

  try {
    return await prisma.product.delete({
      where: {
        id: productId
      },
      include: {
        category: true
      }
    });
  } catch (error) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2025"
    ) {
      throw new ProductNotFoundError();
    }

    throw error;
  }
};

export const bulkDeleteProducts = async (
  prisma: PrismaClient,
  productIds: string[]
) => {
  const uniqueProductIds = [...new Set(productIds)];

  if (uniqueProductIds.length === 0) {
    throw new InvalidProductSelectionError("Pilih minimal satu produk.");
  }

  try {
    return await prisma.$transaction(async (tx) => {
      const products = await tx.product.findMany({
        where: { id: { in: uniqueProductIds } },
        select: { id: true, name: true }
      });

      if (products.length !== uniqueProductIds.length) {
        throw new ProductNotFoundError();
      }

      const deleted = await tx.product.deleteMany({
        where: { id: { in: uniqueProductIds } }
      });

      return { deletedCount: deleted.count, products };
    });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2003") {
      throw new ProductDeleteConflictError(
        "Produk tidak dapat dihapus karena masih digunakan pada purchase order."
      );
    }

    throw error;
  }
};

export const bulkUpdateProducts = async (
  prisma: PrismaClient,
  updates: BulkUpdateProductInput[]
) => {
  if (updates.length === 0) {
    throw new InvalidProductDataError("Tidak ada perubahan produk untuk disimpan.");
  }

  const ids = updates.map((item) => item.id);
  if (new Set(ids).size !== ids.length) {
    throw new InvalidProductDataError("ID produk duplikat pada permintaan.");
  }

  for (const item of updates) {
    item.name = trimAndStrip(item.name);
    item.barcode = item.barcode ? trimAndStrip(item.barcode) : null;
    if (!item.name) throw new InvalidProductDataError("Nama produk tidak boleh kosong.");
    if (item.purchasePrice === null || !Number.isFinite(item.purchasePrice) || item.purchasePrice < 0) {
      throw new InvalidProductDataError("Harga beli harus lebih besar atau sama dengan 0.");
    }
    if (!Number.isFinite(item.sellingPrice) || item.sellingPrice < 0) {
      throw new InvalidProductDataError("Harga jual harus lebih besar atau sama dengan 0.");
    }
  }

  const barcodes = updates.map((item) => item.barcode).filter((value): value is string => Boolean(value));
  if (new Set(barcodes).size !== barcodes.length) throw new BarcodeAlreadyExistsError();

  return prisma.$transaction(async (tx) => {
    const existingCount = await tx.product.count({ where: { id: { in: ids } } });
    if (existingCount !== ids.length) throw new ProductNotFoundError();

    if (barcodes.length) {
      const conflict = await tx.product.findFirst({
        where: { barcode: { in: barcodes }, id: { notIn: ids } },
        select: { id: true }
      });
      if (conflict) throw new BarcodeAlreadyExistsError();
    }

    // Clear barcodes first so valid swaps between products do not hit the
    // unique constraint midway through the atomic batch.
    await tx.product.updateMany({
      where: { id: { in: ids } },
      data: { barcode: null }
    });

    const products = await Promise.all(updates.map((item) =>
      tx.product.update({
        where: { id: item.id },
        data: {
          name: item.name,
          barcode: item.barcode,
          purchasePrice: item.purchasePrice,
          sellingPrice: item.sellingPrice
        },
        include: { category: true }
      })
    ));

    return { updatedCount: products.length, products };
  });
};

export const adjustProductStock = async (
  prisma: PrismaClient,
  productId: string,
  data: AdjustStockInput,
  userName?: string
) => {
  if (!Number.isInteger(data.quantity) || data.quantity < 0) {
    throw new InvalidStockAdjustmentError("Quantity must be greater than or equal to 0");
  }

  if (data.type !== StockAdjustmentType.SET && data.quantity === 0) {
    throw new InvalidStockAdjustmentError("Quantity must be greater than 0");
  }

  return prisma.$transaction(async (tx) => {
    const product = await tx.product.findUnique({
      where: {
        id: productId
      }
    });

    if (!product) {
      throw new ProductNotFoundError();
    }

    const previousStock = product.stock;
    const currentStock =
      data.type === StockAdjustmentType.ADD
        ? previousStock + data.quantity
        : data.type === StockAdjustmentType.REDUCE
          ? previousStock - data.quantity
          : data.quantity;

    if (currentStock < 0) {
      throw new InvalidStockAdjustmentError("Stock cannot be negative");
    }

    const updatedProduct = await tx.product.update({
      where: {
        id: productId
      },
      data: {
        stock: currentStock
      },
      include: {
        category: true
      }
    });

    const history = await tx.stockHistory.create({
      data: {
        productId,
        type: data.type,
        quantity: data.quantity,
        previousStock,
        currentStock,
        referenceType: StockReferenceType.ADJUSTMENT,
        referenceId: productId,
        userName,
        note: data.note?.trim() ?? ""
      }
    });

    return {
      product: updatedProduct,
      history
    };
  });
};

export const restockProducts = async (
  prisma: PrismaClient,
  items: RestockProductInput[],
  userName?: string
) => {
  if (!items.length) {
    throw new InvalidRestockDataError("Daftar restok masih kosong.");
  }

  const productIds = new Set<string>();

  for (const item of items) {
    if (!item.productId) {
      throw new InvalidRestockDataError("Produk restok tidak valid.");
    }

    if (productIds.has(item.productId)) {
      throw new InvalidRestockDataError("Produk yang sama tidak boleh duplikat.");
    }

    if (!Number.isInteger(item.quantity) || item.quantity <= 0) {
      throw new InvalidRestockDataError("Qty restok harus lebih dari 0.");
    }

    if (!Number.isFinite(item.purchasePrice) || item.purchasePrice < 0) {
      throw new InvalidRestockDataError("Harga beli harus 0 atau lebih.");
    }

    if (!Number.isFinite(item.sellingPrice) || item.sellingPrice < 0) {
      throw new InvalidRestockDataError("Harga jual harus 0 atau lebih.");
    }

    productIds.add(item.productId);
  }

  return prisma.$transaction(async (tx) => {
    const products = await tx.product.findMany({
      where: {
        id: {
          in: [...productIds]
        },
        status: RecordStatus.ACTIVE
      },
      include: {
        category: true
      }
    });
    const productById = new Map(products.map((product) => [product.id, product]));

    if (products.length !== productIds.size) {
      throw new ProductNotFoundError();
    }

    const histories = [];
    const updatedProducts = [];

    for (const item of items) {
      const product = productById.get(item.productId);

      if (!product) {
        throw new ProductNotFoundError();
      }

      const previousStock = product.stock;
      const currentStock = previousStock + item.quantity;
      const purchasePriceChanged =
        product.purchasePrice === null ||
        Number(product.purchasePrice) !== item.purchasePrice;
      const sellingPriceChanged =
        Number(product.sellingPrice) !== item.sellingPrice;
      const updateResult = await tx.product.updateMany({
        where: {
          id: product.id,
          status: RecordStatus.ACTIVE
        },
        data: {
          stock: {
            increment: item.quantity
          },
          ...(purchasePriceChanged
            ? { purchasePrice: item.purchasePrice }
            : {}),
          ...(sellingPriceChanged
            ? { sellingPrice: item.sellingPrice }
            : {})
        }
      });

      if (updateResult.count !== 1) {
        throw new ProductNotFoundError();
      }

      const updatedProduct = await tx.product.findUniqueOrThrow({
        where: {
          id: product.id
        },
        include: {
          category: true
        }
      });

      const history = await tx.stockHistory.create({
        data: {
          productId: product.id,
          type: StockAdjustmentType.ADD,
          quantity: item.quantity,
          previousStock,
          currentStock,
          referenceType: StockReferenceType.RESTOCK,
          referenceId: product.id,
          userName,
          note: "Restok barang"
        }
      });

      histories.push(history);
      updatedProducts.push(updatedProduct);
    }

    await tx.activityLog.create({
      data: {
        type: ActivityType.STOCK_RESTOCK,
        title: "Restok Barang",
        description: `${items.length} produk direstok.`,
        metadata: {
          items: items.map((item) => {
            const product = productById.get(item.productId);

            return {
              productId: item.productId,
              barcode: product?.barcode,
              name: product?.name,
              quantity: item.quantity,
              purchasePrice: item.purchasePrice,
              sellingPrice: item.sellingPrice,
              previousStock: product?.stock,
              currentStock: (product?.stock ?? 0) + item.quantity
            };
          })
        }
      }
    });

    return {
      products: updatedProducts,
      histories
    };
  });
};

export const getProductStockHistory = async (
  prisma: PrismaClient,
  productId: string
) => {
  const product = await prisma.product.findUnique({
    where: {
      id: productId
    },
    select: {
      id: true
    }
  });

  if (!product) {
    throw new ProductNotFoundError();
  }

  return prisma.stockHistory.findMany({
    where: {
      productId
    },
    orderBy: {
      createdAt: "desc"
    }
  });
};

export const getStockHistories = async (
  prisma: PrismaClient,
  params: GetStockHistoriesInput
) => {
  const skip = (params.page - 1) * params.limit;
  const where: Prisma.StockHistoryWhereInput = {
    ...(params.productId ? { productId: params.productId } : {}),
    ...(params.referenceType
      ? { referenceType: params.referenceType }
      : {}),
    ...(params.startDate || params.endDate
      ? {
          createdAt: {
            ...(params.startDate ? { gte: params.startDate } : {}),
            ...(params.endDate ? { lte: params.endDate } : {})
          }
        }
      : {})
  };

  const [histories, total] = await prisma.$transaction([
    prisma.stockHistory.findMany({
      where,
      skip,
      take: params.limit,
      orderBy: {
        createdAt: "desc"
      },
      include: {
        product: {
          select: {
            id: true,
            name: true,
            barcode: true
          }
        }
      }
    }),
    prisma.stockHistory.count({ where })
  ]);

  return {
    data: histories,
    pagination: {
      page: params.page,
      limit: params.limit,
      total,
      totalPages: Math.max(1, Math.ceil(total / params.limit))
    }
  };
};

const normalizeDatasetStatus = (value: string) => {
  if (!value || value === "Aktif" || value === "ACTIVE") {
    return RecordStatus.ACTIVE;
  }

  if (value === "Nonaktif" || value === "INACTIVE") {
    return RecordStatus.INACTIVE;
  }

  throw new ProductDatasetValidationError(`Status produk tidak valid: ${value}`);
};

const getCellText = (row: ExcelJS.Row, columnNumber: number) =>
  row.getCell(columnNumber).text.trim();

const getCellNumber = (row: ExcelJS.Row, columnNumber: number) => {
  const text = getCellText(row, columnNumber);
  const numericValue = Number(text.replace(/[^\d.-]/g, ""));

  if (!Number.isFinite(numericValue) || numericValue < 0) {
    throw new ProductDatasetValidationError(
      `Nilai angka tidak valid pada baris ${row.number}.`
    );
  }

  return numericValue;
};

const getDatasetColumnIndexes = (worksheet: ExcelJS.Worksheet) => {
  const headerRow = worksheet.getRow(1);
  const columns = new Map<string, number>();

  headerRow.eachCell((cell, columnNumber) => {
    columns.set(cell.text.trim(), columnNumber);
  });

  const requiredHeaders = productDatasetHeaders.filter(
    (header) => header !== "Minimum Stock"
  );

  requiredHeaders.forEach((header) => {
    if (!columns.has(header)) {
      throw new ProductDatasetValidationError(
        "Format header dataset produk tidak sesuai."
      );
    }
  });

  return {
    barcode: columns.get("Barcode")!,
    name: columns.get("Nama Produk")!,
    category: columns.get("Kategori")!,
    supplier: columns.get("Supplier")!,
    purchasePrice: columns.get("Harga Beli")!,
    sellingPrice: columns.get("Harga Jual")!,
    stock: columns.get("Stok")!,
    minimumStock: columns.has("Minimum Stock")
      ? columns.get("Minimum Stock")!
      : columns.has("Minimum Stok")
        ? columns.get("Minimum Stok")!
        : null,
    status: columns.get("Status")!
  };
};

const parseProductDatasetRows = async (fileBuffer: Buffer) => {
  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.load(fileBuffer as unknown as ExcelJS.Buffer);

  const worksheet = workbook.worksheets[0];

  if (!worksheet) {
    throw new ProductDatasetValidationError("File dataset produk kosong.");
  }

  const columns = getDatasetColumnIndexes(worksheet);

  const rows: ProductDatasetRow[] = [];

  worksheet.eachRow((row, rowNumber) => {
    if (rowNumber === 1) {
      return;
    }

    const barcode = getCellText(row, columns.barcode) || null;
    const name = getCellText(row, columns.name);
    const categoryName = getCellText(row, columns.category);
    const supplierName = getCellText(row, columns.supplier);
    const minimumStockText = columns.minimumStock
      ? getCellText(row, columns.minimumStock)
      : "";
    const minimumStock =
      minimumStockText === ""
        ? null
        : getCellNumber(row, columns.minimumStock!);

    if (barcode === null && !name && !categoryName) {
      return;
    }

    if (!name || !categoryName) {
      throw new ProductDatasetValidationError(
        `Nama Produk dan Kategori wajib diisi pada baris ${rowNumber}.`
      );
    }

    if (minimumStock !== null && !Number.isInteger(minimumStock)) {
      throw new ProductDatasetValidationError(
        `Minimum Stock harus berupa bilangan bulat pada baris ${rowNumber}.`
      );
    }

    rows.push({
      barcode,
      name,
      categoryName,
      supplierName,
      purchasePrice: getCellNumber(row, columns.purchasePrice),
      sellingPrice: getCellNumber(row, columns.sellingPrice),
      stock:
        getCellText(row, columns.stock) === ""
          ? 0
          : Math.trunc(getCellNumber(row, columns.stock)),
      minimumStock,
      status: normalizeDatasetStatus(getCellText(row, columns.status))
    });
  });

  return rows;
};

const normalizeProductName = (name: string) =>
  name.trim().toLowerCase().replace(/\s+/g, " ");

const deduplicateProductDatasetRows = (rows: ProductDatasetRow[]) => {
  const seenKeys = new Set<string>();
  const uniqueRows: ProductDatasetRow[] = [];
  let skippedDuplicateRows = 0;

  for (const row of rows) {
    const key = row.barcode
      ? `barcode:${row.barcode}`
      : `name:${normalizeProductName(row.name)}`;

    if (seenKeys.has(key)) {
      skippedDuplicateRows += 1;
      continue;
    }

    seenKeys.add(key);
    uniqueRows.push(row);
  }

  return { uniqueRows, skippedDuplicateRows };
};

export const exportProductDataset = async (prisma: PrismaClient) => {
  const products = await prisma.product.findMany({
    where: {
      status: RecordStatus.ACTIVE
    },
    include: {
      category: true,
      supplier: true
    },
    orderBy: {
      name: "asc"
    }
  });

  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet("Dataset Produk");

  worksheet.columns = productDatasetHeaders.map((header) => ({
    header,
    key: header,
    width: header.length + 4
  }));

  worksheet.getRow(1).font = { bold: true };

  products.forEach((product) => {
    worksheet.addRow({
      Barcode: product.barcode,
      "Nama Produk": product.name,
      Kategori: product.category.name,
      Supplier: product.supplier?.name ?? "",
      "Harga Beli": Number(product.purchasePrice),
      "Harga Jual": Number(product.sellingPrice),
      Stok: product.stock,
      "Minimum Stock": product.minimumStock,
      Status: product.status === RecordStatus.ACTIVE ? "Aktif" : "Nonaktif"
    });
  });

  worksheet.columns.forEach((column) => {
    let maxLength = 10;

    column.eachCell?.({ includeEmpty: true }, (cell) => {
      maxLength = Math.max(maxLength, cell.text.length);
    });

    column.width = maxLength + 2;
  });

  return workbook.xlsx.writeBuffer();
};

export const previewProductDatasetImport = async (
  prisma: PrismaClient,
  fileBuffer: Buffer
) => {
  const rows = await parseProductDatasetRows(fileBuffer);
  const barcodes = rows.flatMap((row) =>
    row.barcode === null ? [] : [row.barcode]
  );
  const existingProducts =
    barcodes.length === 0
      ? []
      : await prisma.product.findMany({
          where: {
            barcode: {
              in: barcodes
            }
          },
          select: {
            barcode: true
          }
        });
  const existingBarcodes = new Set(existingProducts.map((product) => product.barcode));

  return {
    totalData: rows.length,
    duplicateBarcodes: rows.filter(
      (row) => row.barcode !== null && existingBarcodes.has(row.barcode)
    ).length,
    newProducts: rows.filter(
      (row) => row.barcode === null || !existingBarcodes.has(row.barcode)
    ).length
  } satisfies ProductDatasetPreview;
};

const findOrCreateCategory = async (
  tx: Prisma.TransactionClient,
  name: string
) => {
  const normalizedName = name.trim().toUpperCase();
  const category = await tx.category.findFirst({
    where: {
      name: { equals: normalizedName, mode: "insensitive" }
    },
    select: {
      id: true
    }
  });

  if (category) {
    return category.id;
  }

  const newCategory = await tx.category.create({
    data: {
      name: normalizedName,
      status: RecordStatus.ACTIVE
    },
    select: {
      id: true
    }
  });

  return newCategory.id;
};

const findOrCreateSupplier = async (
  tx: Prisma.TransactionClient,
  name: string
) => {
  if (!name) {
    return null;
  }

  const supplier = await tx.supplier.findFirst({
    where: {
      name
    },
    select: {
      id: true
    }
  });

  if (supplier) {
    return supplier.id;
  }

  const newSupplier = await tx.supplier.create({
    data: {
      name,
      isActive: true
    },
    select: {
      id: true
    }
  });

  return newSupplier.id;
};

export const importProductDataset = async (
  prisma: PrismaClient,
  fileBuffer: Buffer,
  userName?: string
) => {
  const rows = await parseProductDatasetRows(fileBuffer);
  const { uniqueRows, skippedDuplicateRows } =
    deduplicateProductDatasetRows(rows);
  const result: ProductDatasetImportResult = {
    inserted: 0,
    updated: 0,
    skippedDuplicateRows,
    failed: 0
  };

  return prisma.$transaction(async (tx) => {
    const existingProducts = await tx.product.findMany({
      select: {
        id: true,
        barcode: true,
        name: true,
        stock: true,
        minimumStock: true
      }
    });
    const productByBarcode = new Map(
      existingProducts.flatMap((product) =>
        product.barcode ? [[product.barcode, product] as const] : []
      )
    );
    const productByNormalizedName = new Map(
      existingProducts.map((product) => [
        normalizeProductName(product.name),
        product
      ])
    );

    for (const row of uniqueRows) {
      try {
        const normalizedName = normalizeProductName(row.name);
        const existingProduct =
          (row.barcode ? productByBarcode.get(row.barcode) : undefined) ??
          productByNormalizedName.get(normalizedName);
        const categoryId = await findOrCreateCategory(tx, row.categoryName);
        const supplierId = await findOrCreateSupplier(tx, row.supplierName);
        const data = {
          barcode: row.barcode,
          name: row.name,
          categoryId,
          supplierId,
          purchasePrice: row.purchasePrice,
          sellingPrice: row.sellingPrice,
          stock: row.stock,
          ...(row.minimumStock === null
            ? {}
            : { minimumStock: row.minimumStock }),
          status: row.status
        };

        if (existingProduct) {
          const updatedProduct = await tx.product.update({
            where: {
              id: existingProduct.id
            },
            data,
            select: {
              id: true,
              barcode: true,
              name: true,
              stock: true,
              minimumStock: true
            }
          });
          if (existingProduct.stock !== row.stock) {
            await tx.stockHistory.create({
              data: {
                productId: existingProduct.id,
                type: StockAdjustmentType.SET,
                quantity: Math.abs(row.stock - existingProduct.stock),
                previousStock: existingProduct.stock,
                currentStock: row.stock,
                referenceType: StockReferenceType.ADJUSTMENT,
                referenceId: existingProduct.id,
                userName,
                note: "Stok diubah melalui import dataset"
              }
            });
          }
          if (existingProduct.barcode && existingProduct.barcode !== updatedProduct.barcode) {
            productByBarcode.delete(existingProduct.barcode);
          }
          if (updatedProduct.barcode) {
            productByBarcode.set(updatedProduct.barcode, updatedProduct);
          }
          const previousNormalizedName = normalizeProductName(existingProduct.name);
          if (previousNormalizedName !== normalizedName) {
            productByNormalizedName.delete(previousNormalizedName);
          }
          productByNormalizedName.set(normalizedName, updatedProduct);
          result.updated += 1;
          continue;
        }

        const product = await tx.product.create({
          data,
          select: {
            id: true,
            barcode: true,
            name: true,
            stock: true,
            minimumStock: true
          }
        });
        if (product.stock !== 0) {
          await tx.stockHistory.create({
            data: {
              productId: product.id,
              type: StockAdjustmentType.SET,
              quantity: product.stock,
              previousStock: 0,
              currentStock: product.stock,
              referenceType: StockReferenceType.ADJUSTMENT,
              referenceId: product.id,
              userName,
              note: "Stok awal dari import dataset"
            }
          });
        }
        if (product.barcode) {
          productByBarcode.set(product.barcode, product);
        }
        productByNormalizedName.set(normalizedName, product);
        result.inserted += 1;
      } catch (error) {
        result.failed += 1;
        throw error;
      }
    }

    return result;
  });
};
