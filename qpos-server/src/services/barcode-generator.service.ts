import type { PrismaClient } from "../generated/prisma/client";

const createBarcodeCandidate = () => {
  const timestamp = Date.now().toString().slice(-8);
  const random = Math.floor(Math.random() * 10_000)
    .toString()
    .padStart(4, "0");

  return `${timestamp}${random}`;
};

export class BarcodeGenerationFailedError extends Error {
  constructor() {
    super("Barcode unik gagal dibuat.");
  }
}

export class BarcodeProductNotFoundError extends Error {
  constructor() {
    super("Produk tidak ditemukan.");
  }
}

const generateUniqueBarcode = async (prisma: PrismaClient) => {
  for (let attempt = 0; attempt < 20; attempt += 1) {
    const barcode = createBarcodeCandidate();
    const existingProduct = await prisma.product.findUnique({
      where: { barcode },
      select: { id: true }
    });

    if (!existingProduct) return barcode;
  }

  throw new BarcodeGenerationFailedError();
};

export const generateProductBarcode = async (
  prisma: PrismaClient,
  productId: string
) => {
  const product = await prisma.product.findUnique({
    where: { id: productId },
    include: { category: true }
  });

  if (!product) throw new BarcodeProductNotFoundError();
  if (product.barcode) return product;

  for (let attempt = 0; attempt < 5; attempt += 1) {
    const barcode = await generateUniqueBarcode(prisma);
    const result = await prisma.product.updateMany({
      where: { id: productId, barcode: null },
      data: { barcode }
    });

    if (result.count === 1) {
      return prisma.product.findUniqueOrThrow({
        where: { id: productId },
        include: { category: true }
      });
    }

    const currentProduct = await prisma.product.findUnique({
      where: { id: productId },
      include: { category: true }
    });

    if (!currentProduct) throw new BarcodeProductNotFoundError();
    if (currentProduct.barcode) return currentProduct;
  }

  throw new BarcodeGenerationFailedError();
};
