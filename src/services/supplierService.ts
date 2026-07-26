import axios from "axios";
import { apiService } from "./api/apiService";
import type { Supplier, SupplierFormValues, SupplierApiItem } from "../types/supplier";

export class SupplierApiError extends Error {
  public readonly status?: number;
  public readonly productCount?: number;

  constructor(message: string, status?: number, productCount?: number) {
    super(message);
    this.status = status;
    this.productCount = productCount;
  }
}

function mapSupplier(supplier: SupplierApiItem): Supplier {
  return {
    id: supplier.id,
    name: supplier.name,
    phone: supplier.phone ?? "",
    email: supplier.email ?? "",
    address: supplier.address ?? "",
    notes: supplier.notes ?? "",
    isActive: supplier.isActive,
    createdAt: supplier.createdAt,
    updatedAt: supplier.updatedAt,
  };
}

function handleSupplierError(error: unknown): never {
  if (axios.isAxiosError<{ message?: string; productCount?: number }>(error)) {
    if (!error.response) {
      throw new SupplierApiError("Backend tidak dapat diakses.");
    }

    throw new SupplierApiError(
      error.response.data?.message ?? "Terjadi kesalahan pada server.",
      error.response.status,
      error.response.data?.productCount,
    );
  }

  throw error;
}

export const supplierService = {
  getSuppliers: async (search?: string) => {
    try {
      const query = search ? `?search=${encodeURIComponent(search)}` : "";
      const response = await apiService.get<SupplierApiItem[]>(
        `/suppliers${query}`,
      );

      return response.data.map(mapSupplier);
    } catch (error) {
      handleSupplierError(error);
    }
  },
  createSupplier: async (values: SupplierFormValues) => {
    try {
      const response = await apiService.post<SupplierApiItem, SupplierFormValues>(
        "/suppliers",
        values,
      );

      return mapSupplier(response.data);
    } catch (error) {
      handleSupplierError(error);
    }
  },
  updateSupplier: async (supplierId: string, values: SupplierFormValues) => {
    try {
      const response = await apiService.put<SupplierApiItem, SupplierFormValues>(
        `/suppliers/${supplierId}`,
        values,
      );

      return mapSupplier(response.data);
    } catch (error) {
      handleSupplierError(error);
    }
  },
  setSupplierActive: async (
    supplierId: string,
    values: SupplierFormValues,
    isActive: boolean,
  ) => {
    try {
      const response = await apiService.put<
        SupplierApiItem,
        SupplierFormValues & { isActive: boolean }
      >(`/suppliers/${supplierId}`, {
        ...values,
        isActive,
      });

      return mapSupplier(response.data);
    } catch (error) {
      handleSupplierError(error);
    }
  },
  deleteSupplier: async (supplierId: string) => {
    try {
      const response = await apiService.delete<SupplierApiItem>(
        `/suppliers/${supplierId}`,
      );

      return mapSupplier(response.data);
    } catch (error) {
      handleSupplierError(error);
    }
  },
};
