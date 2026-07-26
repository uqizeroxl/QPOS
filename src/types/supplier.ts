export type Supplier = {
  id: string;
  name: string;
  phone?: string;
  email?: string;
  address?: string;
  notes?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
};

export type SupplierFormValues = Pick<
  Supplier,
  "name" | "phone" | "email" | "address" | "notes"
>;

export type SupplierApiItem = {
  id: string;
  name: string;
  phone?: string | null;
  email?: string | null;
  address?: string | null;
  notes?: string | null;
  isActive: boolean;
  _count?: { products: number };
  createdAt: string;
  updatedAt: string;
};

export type CreateSupplierPayload = {
  name: string;
  phone?: string;
  email?: string;
  address?: string;
  note?: string;
  isActive?: boolean;
};

export type UpdateSupplierPayload = CreateSupplierPayload;
