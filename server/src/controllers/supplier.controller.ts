import { NextFunction, Request, Response } from "express";

import * as supplierService from "../services/supplier.service";
import type { AuthenticatedRequest } from "../middleware/auth.middleware";

type SupplierParams = {
  id: string;
};

type SupplierRequestBody = {
  name?: string;
  phone?: string;
  email?: string;
  address?: string;
  note?: string;
  notes?: string;
  isActive?: boolean;
};

type SupplierQuery = {
  search?: string;
};

const getSupplierPayload = (body: SupplierRequestBody) => ({
  name: body.name?.trim() ?? "",
  phone: body.phone,
  email: body.email,
  address: body.address,
  note: body.note ?? body.notes,
  isActive: body.isActive
});

export const getAllSuppliers = async (
  req: AuthenticatedRequest & Request<unknown, unknown, unknown, SupplierQuery>,
  res: Response,
  next: NextFunction
) => {
  try {
    const prisma = req.tenant.prisma;
    const suppliers = await supplierService.getAllSuppliers(
      prisma,
      req.query.search?.trim() || undefined
    );

    res.status(200).json({
      success: true,
      message: "Suppliers retrieved successfully",
      data: suppliers
    });
  } catch (error) {
    console.error("Unexpected error while retrieving suppliers:", error);
    next(error);
  }
};

export const createSupplier = async (
  req: AuthenticatedRequest & Request<unknown, unknown, SupplierRequestBody>,
  res: Response,
  next: NextFunction
) => {
  try {
    const prisma = req.tenant.prisma;
    const supplier = await supplierService.createSupplier(
      prisma,
      getSupplierPayload(req.body)
    );

    res.status(201).json({
      success: true,
      message: "Supplier created successfully",
      data: supplier
    });
  } catch (error) {
    if (error instanceof supplierService.SupplierNameRequiredError) {
      res.status(400).json({ success: false, message: error.message });
      return;
    }

    if (error instanceof supplierService.SupplierAlreadyExistsError) {
      res.status(409).json({ success: false, message: error.message });
      return;
    }

    console.error("Unexpected error while creating supplier:", error);
    next(error);
  }
};

export const updateSupplier = async (
  req: AuthenticatedRequest & Request<SupplierParams, unknown, SupplierRequestBody>,
  res: Response,
  next: NextFunction
) => {
  try {
    const prisma = req.tenant.prisma;
    const supplier = await supplierService.updateSupplier(
      prisma,
      req.params.id,
      getSupplierPayload(req.body)
    );

    res.status(200).json({
      success: true,
      message: "Supplier updated successfully",
      data: supplier
    });
  } catch (error) {
    if (error instanceof supplierService.SupplierNameRequiredError) {
      res.status(400).json({ success: false, message: error.message });
      return;
    }

    if (error instanceof supplierService.SupplierAlreadyExistsError) {
      res.status(409).json({ success: false, message: error.message });
      return;
    }

    if (error instanceof supplierService.SupplierNotFoundError) {
      res.status(404).json({ success: false, message: error.message });
      return;
    }

    console.error("Unexpected error while updating supplier:", error);
    next(error);
  }
};

export const deleteSupplier = async (
  req: AuthenticatedRequest & Request<SupplierParams>,
  res: Response,
  next: NextFunction
) => {
  try {
    const prisma = req.tenant.prisma;
    const supplier = await supplierService.deleteSupplier(
      prisma,
      req.params.id
    );

    res.status(200).json({
      success: true,
      message: "Supplier deleted permanently",
      data: supplier
    });
  } catch (error) {
    if (error instanceof supplierService.SupplierNotFoundError) {
      res.status(404).json({ success: false, message: error.message });
      return;
    }

    if (error instanceof supplierService.SupplierInUseError) {
      res.status(409).json({
        success: false,
        message: error.message,
        productCount: error.productCount
      });
      return;
    }

    console.error("Unexpected error while deleting supplier:", error);
    next(error);
  }
};
