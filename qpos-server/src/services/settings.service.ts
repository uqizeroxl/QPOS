import type { PrismaClient } from "../generated/prisma/client";

export type ProductDatasetResetResult = {
  stockHistories: number;
  products: number;
  categories: number;
  suppliers: number;
};

export const resetProductDataset = async (
  prisma: PrismaClient
): Promise<ProductDatasetResetResult> =>
  prisma.$transaction(async (tx) => {
    const stockHistories = await tx.stockHistory.deleteMany();
    const products = await tx.product.deleteMany();
    const categories = await tx.category.deleteMany();
    const suppliers = await tx.supplier.deleteMany();

    return {
      stockHistories: stockHistories.count,
      products: products.count,
      categories: categories.count,
      suppliers: suppliers.count
    };
  });
