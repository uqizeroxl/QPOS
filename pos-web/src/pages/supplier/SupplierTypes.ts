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
