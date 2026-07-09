export type ProductStatus = "Aktif" | "Nonaktif";

export type Product = {
  id: string;
  barcode: string;
  name: string;
  categoryId?: string;
  category: string;
  purchasePrice: number;
  sellingPrice: number;
  stock: number;
  status: ProductStatus;
};

export type ProductFormValues = Omit<Product, "id">;

export type BarcodeLabelSize = "small" | "medium" | "large";

export type BarcodePrintSettings = {
  labelSize: BarcodeLabelSize;
  quantity: number;
  showPrice: boolean;
};

export type BarcodePrintPayload = BarcodePrintSettings & {
  barcode: string;
  productName: string;
  priceLabel: string;
};
