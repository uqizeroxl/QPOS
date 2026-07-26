import { NextFunction, Request, Response } from "express";

import { RecordStatus } from "../generated/prisma/client";
import * as categoryService from "../services/category.service";
import type { AuthenticatedRequest } from "../middleware/auth.middleware";

type CreateCategoryRequestBody = {
  name?: string;
  description?: string;
  status?: string;
};

type CategoryParams = {
  id: string;
};

const parseCategoryStatus = (status?: string) => {
  if (!status || status === "Aktif" || status === "ACTIVE") {
    return RecordStatus.ACTIVE;
  }

  if (status === "Nonaktif" || status === "INACTIVE") {
    return RecordStatus.INACTIVE;
  }

  return null;
};

export const getAllCategories = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const prisma = req.tenant.prisma;
    const categories = await categoryService.getAllCategories(prisma);

    res.status(200).json({
      success: true,
      message: "Categories retrieved successfully",
      data: categories
    });
  } catch (error) {
    console.error("Unexpected error while retrieving categories:", error);
    next(error);
  }
};

export const createCategory = async (
  req: AuthenticatedRequest & Request<unknown, unknown, CreateCategoryRequestBody>,
  res: Response,
  next: NextFunction
) => {
  try {
    const prisma = req.tenant.prisma;
    const name = req.body.name?.trim();
    const description = req.body.description?.trim() ?? "";
    const status = parseCategoryStatus(req.body.status?.trim());

    if (!name) {
      res.status(400).json({
        success: false,
        message: "Nama kategori wajib diisi."
      });
      return;
    }

    if (!status) {
      res.status(400).json({
        success: false,
        message: "Status kategori tidak valid."
      });
      return;
    }

    const category = await categoryService.createCategory(
      prisma,
      {
        name,
        description,
        status
      }
    );

    res.status(201).json({
      success: true,
      message: "Kategori berhasil ditambahkan.",
      data: category
    });
  } catch (error) {
    if (error instanceof categoryService.CategoryNameRequiredError) {
      res.status(400).json({
        success: false,
        message: "Nama kategori wajib diisi."
      });
      return;
    }

    if (error instanceof categoryService.CategoryAlreadyExistsError) {
      res.status(409).json({
        success: false,
        message: "Nama kategori tidak boleh duplikat."
      });
      return;
    }

    console.error("Unexpected error while creating category:", error);
    next(error);
  }
};

export const updateCategory = async (
  req: AuthenticatedRequest & Request<CategoryParams, unknown, CreateCategoryRequestBody>,
  res: Response,
  next: NextFunction
) => {
  try {
    const prisma = req.tenant.prisma;
    const name = req.body.name?.trim();
    const description = req.body.description?.trim() ?? "";
    const status = parseCategoryStatus(req.body.status?.trim());

    if (!name) {
      res.status(400).json({
        success: false,
        message: "Nama kategori wajib diisi."
      });
      return;
    }

    if (!status) {
      res.status(400).json({
        success: false,
        message: "Status kategori tidak valid."
      });
      return;
    }

    const category = await categoryService.updateCategory(
      prisma,
      req.params.id,
      {
        name,
        description,
        status
      }
    );

    res.status(200).json({
      success: true,
      message: "Kategori berhasil diperbarui.",
      data: category
    });
  } catch (error) {
    if (error instanceof categoryService.CategoryNameRequiredError) {
      res.status(400).json({
        success: false,
        message: "Nama kategori wajib diisi."
      });
      return;
    }

    if (error instanceof categoryService.CategoryNotFoundError) {
      res.status(404).json({
        success: false,
        message: "Kategori tidak ditemukan."
      });
      return;
    }

    if (error instanceof categoryService.CategoryAlreadyExistsError) {
      res.status(409).json({
        success: false,
        message: "Nama kategori tidak boleh duplikat."
      });
      return;
    }

    console.error("Unexpected error while updating category:", error);
    next(error);
  }
};

export const deleteCategory = async (
  req: AuthenticatedRequest & Request<CategoryParams>,
  res: Response,
  next: NextFunction
) => {
  try {
    const prisma = req.tenant.prisma;
    const category = await categoryService.deleteCategory(
      prisma,
      req.params.id
    );

    res.status(200).json({
      success: true,
      message: "Kategori berhasil dihapus.",
      data: category
    });
  } catch (error) {
    if (error instanceof categoryService.CategoryNotFoundError) {
      res.status(404).json({
        success: false,
        message: "Kategori tidak ditemukan."
      });
      return;
    }

    if (error instanceof categoryService.CategoryInUseError) {
      res.status(409).json({
        success: false,
        message: "Kategori tidak dapat dihapus karena masih digunakan oleh produk.",
        productCount: error.productCount
      });
      return;
    }

    console.error("Unexpected error while deleting category:", error);
    next(error);
  }
};
