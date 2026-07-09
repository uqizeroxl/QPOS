import axios from "axios";
import { apiService } from "./api/apiService";

export type PurchaseOrderStatus =
  | "DRAFT"
  | "ORDERED"
  | "RECEIVED"
  | "CANCELLED";

export type PurchaseOrder = {
  id: string;
  poNumber: string;
  supplierId: string;
  status: PurchaseOrderStatus;
  note: string;
  supplier: {
    id: string;
    name: string;
  };
  items: {
    id: string;
    productId: string;
    quantity: number;
    cost: number;
    product: {
      id: string;
      barcode: string;
      name: string;
    };
  }[];
  createdAt: string;
  updatedAt: string;
};

export type PurchaseOrderPayload = {
  supplierId: string;
  note: string;
  items: {
    productId: string;
    quantity: number;
    cost: number;
  }[];
};

type PurchaseOrderApiItem = Omit<PurchaseOrder, "items"> & {
  items: Array<
    Omit<PurchaseOrder["items"][number], "cost"> & {
      cost: string | number;
    }
  >;
};

export class PurchaseOrderApiError extends Error {
  public readonly status?: number;

  constructor(message: string, status?: number) {
    super(message);
    this.status = status;
  }
}

function mapPurchaseOrder(purchaseOrder: PurchaseOrderApiItem): PurchaseOrder {
  return {
    ...purchaseOrder,
    items: purchaseOrder.items.map((item) => ({
      ...item,
      cost: Number(item.cost),
    })),
  };
}

function handlePurchaseOrderError(error: unknown): never {
  if (axios.isAxiosError<{ message?: string }>(error)) {
    if (!error.response) {
      throw new PurchaseOrderApiError("Backend tidak dapat diakses.");
    }

    throw new PurchaseOrderApiError(
      error.response.data?.message ?? "Terjadi kesalahan pada server.",
      error.response.status,
    );
  }

  throw error;
}

export const purchaseOrderService = {
  getPurchaseOrders: async () => {
    try {
      const response = await apiService.get<PurchaseOrderApiItem[]>(
        "/purchase-orders",
      );

      return response.data.map(mapPurchaseOrder);
    } catch (error) {
      handlePurchaseOrderError(error);
    }
  },
  createPurchaseOrder: async (payload: PurchaseOrderPayload) => {
    try {
      const response = await apiService.post<
        PurchaseOrderApiItem,
        PurchaseOrderPayload
      >("/purchase-orders", payload);

      return mapPurchaseOrder(response.data);
    } catch (error) {
      handlePurchaseOrderError(error);
    }
  },
  updatePurchaseOrder: async (
    purchaseOrderId: string,
    payload: PurchaseOrderPayload,
  ) => {
    try {
      const response = await apiService.put<
        PurchaseOrderApiItem,
        PurchaseOrderPayload
      >(`/purchase-orders/${purchaseOrderId}`, payload);

      return mapPurchaseOrder(response.data);
    } catch (error) {
      handlePurchaseOrderError(error);
    }
  },
  deletePurchaseOrder: async (purchaseOrderId: string) => {
    try {
      await apiService.delete<PurchaseOrderApiItem>(
        `/purchase-orders/${purchaseOrderId}`,
      );
    } catch (error) {
      handlePurchaseOrderError(error);
    }
  },
  changeStatus: async (
    purchaseOrderId: string,
    status: PurchaseOrderStatus,
  ) => {
    try {
      const response = await apiService.patch<
        PurchaseOrderApiItem,
        { status: PurchaseOrderStatus }
      >(`/purchase-orders/${purchaseOrderId}/status`, { status });

      return mapPurchaseOrder(response.data);
    } catch (error) {
      handlePurchaseOrderError(error);
    }
  },
};
