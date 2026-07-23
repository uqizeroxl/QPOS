import { Prisma, PrismaClient, RecordStatus } from "../generated/prisma/client";

export type CreateCategoryInput = {
  name: string;
  description?: string;
  status?: RecordStatus;
};

export type UpdateCategoryInput = CreateCategoryInput;

export class CategoryNameRequiredError extends Error {
  constructor() {
    super("Nama kategori wajib diisi.");
  }
}

export class CategoryAlreadyExistsError extends Error {
  constructor() {
    super("Nama kategori tidak boleh duplikat.");
  }
}

export class CategoryNotFoundError extends Error {
  constructor() {
    super("Kategori tidak ditemukan.");
  }
}

export class CategoryInUseError extends Error {
  constructor(public readonly productCount: number) {
    super("Kategori tidak dapat dihapus karena masih digunakan oleh produk.");
  }
}

export const getAllCategories = async (prisma: PrismaClient) => {
  return prisma.category.findMany({
    orderBy: {
      name: "asc"
    }
  });
};

export const createCategory = async (
  prisma: PrismaClient,
  data: CreateCategoryInput
) => {
  const name = data.name.trim();

  if (!name) {
    throw new CategoryNameRequiredError();
  }

  const existingCategory = await prisma.category.findUnique({
    where: {
      name
    }
  });

  if (existingCategory) {
    throw new CategoryAlreadyExistsError();
  }

  try {
    return await prisma.category.create({
      data: {
        name,
        description: data.description?.trim() ?? "",
        status: data.status ?? RecordStatus.ACTIVE
      }
    });
  } catch (error) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2002"
    ) {
      throw new CategoryAlreadyExistsError();
    }

    throw error;
  }
};

export const updateCategory = async (
  prisma: PrismaClient,
  categoryId: string,
  data: UpdateCategoryInput
) => {
  const name = data.name.trim();

  if (!name) {
    throw new CategoryNameRequiredError();
  }

  const currentCategory = await prisma.category.findUnique({
    where: {
      id: categoryId
    }
  });

  if (!currentCategory) {
    throw new CategoryNotFoundError();
  }

  const existingCategory = await prisma.category.findFirst({
    where: {
      name,
      id: {
        not: categoryId
      }
    }
  });

  if (existingCategory) {
    throw new CategoryAlreadyExistsError();
  }

  try {
    return await prisma.category.update({
      where: {
        id: categoryId
      },
      data: {
        name,
        description: data.description?.trim() ?? "",
        status: data.status ?? RecordStatus.ACTIVE
      }
    });
  } catch (error) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2002"
    ) {
      throw new CategoryAlreadyExistsError();
    }

    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2025"
    ) {
      throw new CategoryNotFoundError();
    }

    throw error;
  }
};

export const deleteCategory = async (
  prisma: PrismaClient,
  categoryId: string
) => {
  const currentCategory = await prisma.category.findUnique({
    where: {
      id: categoryId
    }
  });

  if (!currentCategory) {
    throw new CategoryNotFoundError();
  }

  const productCount = await prisma.product.count({
    where: {
      categoryId,
      status: RecordStatus.ACTIVE
    }
  });

  if (productCount > 0) {
    throw new CategoryInUseError(productCount);
  }

  try {
    return await prisma.category.delete({
      where: {
        id: categoryId
      }
    });
  } catch (error) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2025"
    ) {
      throw new CategoryNotFoundError();
    }

    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2003"
    ) {
      const referencedProductCount = await prisma.product.count({
        where: { categoryId }
      });

      throw new CategoryInUseError(referencedProductCount);
    }

    throw error;
  }
};
