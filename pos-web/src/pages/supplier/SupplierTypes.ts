export type Supplier = {
  id: number;
  name: string;
  phone?: string;
  address?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
};

export type SupplierFormValues = Pick<
  Supplier,
  "name" | "phone" | "address" | "notes"
>;
