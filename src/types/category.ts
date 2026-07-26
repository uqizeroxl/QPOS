import type { RecordStatus } from "./enums";

export type CategoryStatus = "Aktif" | "Nonaktif";

export type Category = {
  id: string;
  name: string;
  description: string;
  status: CategoryStatus;
  productCount: number;
  createdAt: string;
  updatedAt: string;
};

export type CategoryFormValues = Pick<
  Category,
  "name" | "description" | "status"
>;

export type CategorySortKey =
  | "name"
  | "productCount"
  | "status"
  | "createdAt"
  | "updatedAt";

export type SortDirection = "asc" | "desc";

export type CategoryApiItem = {
  id: string;
  name: string;
  description: string;
  status: RecordStatus | "Aktif" | "Nonaktif";
  _count?: { products: number };
  productCount?: number;
  createdAt: string;
  updatedAt: string;
};

export type CreateCategoryPayload = {
  name: string;
  description?: string;
  status?: RecordStatus | CategoryStatus;
};

export type UpdateCategoryPayload = CreateCategoryPayload;
