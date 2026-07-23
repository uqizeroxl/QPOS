import { Prisma, PrismaClient, RecordStatus } from "../generated/prisma/client";

export type SupplierInput = {
  name: string;
  phone?: string;
  email?: string;
  address?: string;
  note?: string;
  isActive?: boolean;
};

export class SupplierNameRequiredError extends Error {
  constructor() {
    super("Nama supplier wajib diisi.");
  }
}

export class SupplierAlreadyExistsError extends Error {
  constructor() {
    super("Nama supplier tidak boleh duplikat.");
  }
}

export class SupplierNotFoundError extends Error {
  constructor() {
    super("Supplier tidak ditemukan.");
  }
}

export class SupplierInUseError extends Error {
  constructor(public readonly productCount: number) {
    super("Supplier masih digunakan oleh produk.");
  }
}

const sanitizeSupplier = (data: SupplierInput) => ({
  name: data.name.trim(),
  phone: data.phone?.trim() || null,
  email: data.email?.trim() || null,
  address: data.address?.trim() || null,
  notes: data.note?.trim() || null,
  isActive: data.isActive ?? true
});

export const getAllSuppliers = async (
  prisma: PrismaClient,
  search?: string
) => {
  return prisma.supplier.findMany({
    where: {
      ...(search
        ? {
            name: {
              contains: search,
              mode: "insensitive"
            }
          }
        : {})
    },
    orderBy: {
      createdAt: "desc"
    }
  });
};

export const createSupplier = async (
  prisma: PrismaClient,
  data: SupplierInput
) => {
  const supplier = sanitizeSupplier(data);

  if (!supplier.name) {
    throw new SupplierNameRequiredError();
  }

  try {
    return await prisma.supplier.create({
      data: supplier
    });
  } catch (error) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2002"
    ) {
      throw new SupplierAlreadyExistsError();
    }

    throw error;
  }
};

export const updateSupplier = async (
  prisma: PrismaClient,
  supplierId: string,
  data: SupplierInput
) => {
  const supplier = sanitizeSupplier(data);

  if (!supplier.name) {
    throw new SupplierNameRequiredError();
  }

  try {
    return await prisma.supplier.update({
      where: {
        id: supplierId
      },
      data: supplier
    });
  } catch (error) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2002"
    ) {
      throw new SupplierAlreadyExistsError();
    }

    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2025"
    ) {
      throw new SupplierNotFoundError();
    }

    throw error;
  }
};

export const deleteSupplier = async (
  prisma: PrismaClient,
  supplierId: string
) => {
  const supplier = await prisma.supplier.findUnique({
    where: { id: supplierId },
    select: { id: true }
  });

  if (!supplier) {
    throw new SupplierNotFoundError();
  }

  const productCount = await prisma.product.count({
    where: {
      supplierId,
      status: RecordStatus.ACTIVE
    }
  });

  if (productCount > 0) {
    throw new SupplierInUseError(productCount);
  }

  try {
    return await prisma.supplier.delete({
      where: { id: supplierId }
    });
  } catch (error) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2025"
    ) {
      throw new SupplierNotFoundError();
    }

    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2003"
    ) {
      const referencedProductCount = await prisma.product.count({
        where: { supplierId }
      });

      throw new SupplierInUseError(referencedProductCount);
    }

    throw error;
  }
};
