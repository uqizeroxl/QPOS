import { createContext } from "react";

export type ActivityType =
  | "product-create"
  | "product-update"
  | "product-delete"
  | "category-create"
  | "category-update"
  | "category-delete"
  | "supplier-create"
  | "supplier-update"
  | "supplier-delete"
  | "login"
  | "logout"
  | "transaction-success"
  | "barcode-print"
  | "receipt-print"
  | "stock-restock"
  | "stock-minimum";

export type ActivityLogItem = {
  id: string;
  type: ActivityType;
  title: string;
  description: string;
  createdAt: string;
};

export type AddActivityPayload = Omit<ActivityLogItem, "id" | "createdAt"> & {
  createdAt?: string;
};

export type ActivityContextValue = {
  activities: ActivityLogItem[];
  addActivity: (activity: AddActivityPayload) => void;
  clearActivities: () => void;
};

export const ActivityContext = createContext<ActivityContextValue | undefined>(
  undefined,
);
