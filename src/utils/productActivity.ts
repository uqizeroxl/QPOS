import type { Product, ProductFormValues } from "../types";
import { formatRupiah } from "./currency";

type ProductChangeField = {
  key: keyof ProductFormValues;
  label: string;
  formatValue?: (value: ProductFormValues[keyof ProductFormValues]) => string;
};

const productChangeFields: ProductChangeField[] = [
  { key: "barcode", label: "Barcode" },
  { key: "name", label: "Nama Produk" },
  { key: "category", label: "Kategori" },
  {
    key: "purchasePrice",
    label: "Harga Beli",
    formatValue: (value) => formatRupiah(Number(value), { prefix: true }),
  },
  {
    key: "sellingPrice",
    label: "Harga Jual",
    formatValue: (value) => formatRupiah(Number(value), { prefix: true }),
  },
  { key: "stock", label: "Stok" },
  { key: "status", label: "Status" },
];

function formatChangeValue(
  field: ProductChangeField,
  value: ProductFormValues[keyof ProductFormValues],
) {
  return field.formatValue ? field.formatValue(value) : String(value ?? "");
}

export function getProductUpdateDescription(
  previousProduct: Product,
  nextProduct: ProductFormValues,
) {
  const changes = productChangeFields
    .filter((field) => previousProduct[field.key] !== nextProduct[field.key])
    .map((field) => {
      const previousValue = formatChangeValue(field, previousProduct[field.key]);
      const nextValue = formatChangeValue(field, nextProduct[field.key]);

      return `• ${field.label}\n${previousValue} → ${nextValue}`;
    });

  if (changes.length === 0) {
    return "";
  }

  return `${nextProduct.name}\n\nPerubahan:\n${changes.join("\n\n")}`;
}
