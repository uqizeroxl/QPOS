import { X } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import Button from "../../components/ui/Button";
import Card from "../../components/ui/Card";
import { Input, Select } from "../../components/ui/Input";
import { useActivityLog } from "../../hooks/useActivityLog";
import { generateBarcode } from "../../utils/barcode";
import { formatRupiah, parseRupiah } from "../../utils/currency";
import BarcodePreview from "./BarcodePreview";
import BarcodePrintArea from "./BarcodePrintArea";
import BarcodePrintPanel from "./BarcodePrintPanel";
import type { Category } from "../category/CategoryTypes";
import type {
  BarcodePrintPayload,
  BarcodePrintSettings,
  Product,
  ProductFormValues,
  ProductStatus,
} from "./ProductTypes";

type ProductFormProps = {
  isOpen: boolean;
  categories: Category[];
  existingBarcodes: string[];
  isSubmitting?: boolean;
  product?: Product | null;
  onClose: () => void;
  onSubmit: (values: ProductFormValues) => Promise<boolean>;
};

const initialPrintSettings: BarcodePrintSettings = {
  labelSize: "medium",
  quantity: 1,
  showPrice: true,
};

const getInitialFormValues = (
  categories: Category[],
  product?: Product | null,
): ProductFormValues => {
  if (!product) {
    const firstCategory = categories[0];

    return {
      barcode: "",
      name: "",
      categoryId: firstCategory?.id ?? "",
      category: firstCategory?.name ?? "",
      purchasePrice: null,
      sellingPrice: 0,
      stock: 0,
      status: "Aktif",
    };
  }

  return {
    barcode: product.barcode,
    name: product.name,
    categoryId: product.categoryId ?? "",
    category: product.category,
    purchasePrice: product.purchasePrice,
    sellingPrice: product.sellingPrice,
    stock: product.stock,
    status: product.status,
  };
};

export default function ProductForm({
  isOpen,
  categories,
  existingBarcodes,
  isSubmitting = false,
  product,
  onClose,
  onSubmit,
}: ProductFormProps) {
  const { addActivity } = useActivityLog();
  const [formValues, setFormValues] = useState<ProductFormValues>(() =>
    getInitialFormValues(categories, product),
  );
  const initialFormValues = getInitialFormValues(categories, product);
  const [purchasePriceInput, setPurchasePriceInput] = useState(() =>
    initialFormValues.purchasePrice === null
      ? ""
      : formatRupiah(initialFormValues.purchasePrice),
  );
  const [sellingPriceInput, setSellingPriceInput] = useState(() =>
    formatRupiah(initialFormValues.sellingPrice),
  );
  const [stockInput, setStockInput] = useState(() =>
    initialFormValues.stock.toString(),
  );
  const [autoGenerateWhenEmpty, setAutoGenerateWhenEmpty] = useState(false);
  const [printAfterSave, setPrintAfterSave] = useState(false);
  const [printSettings, setPrintSettings] = useState(initialPrintSettings);
  const [printPayload, setPrintPayload] = useState<BarcodePrintPayload | null>(
    null,
  );
  const [closeAfterPrint, setCloseAfterPrint] = useState(false);
  const [formError, setFormError] = useState("");

  useEffect(() => {
    const handleAfterPrint = () => {
      if (closeAfterPrint) {
        onClose();
      }
    };

    window.addEventListener("afterprint", handleAfterPrint);

    return () => {
      window.removeEventListener("afterprint", handleAfterPrint);
    };
  }, [closeAfterPrint, onClose]);

  const updateField = <Key extends keyof ProductFormValues>(
    key: Key,
    value: ProductFormValues[Key],
  ) => {
    setFormValues((currentValues) => ({
      ...currentValues,
      [key]: value,
    }));
  };

  const updateCategory = useCallback((categoryId: string) => {
    const selectedCategory = categories.find(
      (category) => category.id === categoryId,
    );

    setFormValues((currentValues) => ({
      ...currentValues,
      categoryId,
      category: selectedCategory?.name ?? "",
    }));
  }, [categories]);

  useEffect(() => {
    if (formValues.categoryId || categories.length === 0) {
      return;
    }

    updateCategory(categories[0].id);
  }, [categories, formValues.categoryId, updateCategory]);

  if (!isOpen) {
    return null;
  }

  const getPreparedFormValues = (): ProductFormValues => ({
    ...formValues,
    purchasePrice: purchasePriceInput
      ? parseRupiah(purchasePriceInput)
      : null,
    sellingPrice: parseRupiah(sellingPriceInput),
    stock: Number(stockInput || 0),
  });

  const createPrintPayload = (
    values: ProductFormValues,
  ): BarcodePrintPayload | null => {
    const barcode = values.barcode.trim();

    if (!barcode) {
      return null;
    }

    return {
      ...printSettings,
      barcode,
      productName: values.name.trim() || "Produk",
      priceLabel: formatRupiah(values.sellingPrice, { prefix: true }),
    };
  };

  const requestPrint = (
    payload: BarcodePrintPayload,
    shouldCloseAfterPrint = false,
  ) => {
    addActivity({
      type: "barcode-print",
      title: "Barcode dicetak",
      description: payload.productName,
    });
    setPrintPayload(payload);
    setCloseAfterPrint(shouldCloseAfterPrint);
    window.setTimeout(() => window.print(), 100);
  };

  const handleGenerateBarcode = () => {
    updateField("barcode", generateBarcode(existingBarcodes));
  };

  const handlePrintBarcode = () => {
    const payload = createPrintPayload(getPreparedFormValues());

    if (payload) {
      requestPrint(payload);
    }
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const nextValues: ProductFormValues = {
      ...getPreparedFormValues(),
      barcode:
        formValues.barcode.trim() ||
        (autoGenerateWhenEmpty ? generateBarcode(existingBarcodes) : ""),
    };

    if (!nextValues.name.trim()) {
      setFormError("Nama produk wajib diisi.");
      return;
    }

    if (!nextValues.categoryId) {
      setFormError("Kategori wajib dipilih.");
      return;
    }

    setFormError("");

    const isSaved = await onSubmit(nextValues);

    if (!isSaved) {
      return;
    }

    if (printAfterSave) {
      const shouldPrint = window.confirm(
        "Produk berhasil disimpan. Cetak barcode sekarang?",
      );
      const payload = createPrintPayload(nextValues);

      if (shouldPrint && payload) {
        requestPrint(payload, true);
        return;
      }
    }

    onClose();
  };

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-gray-900/40 p-4">
      <Card className="max-h-[90vh] w-full max-w-2xl overflow-y-auto border-0 shadow-xl">
        <div className="flex items-center justify-between border-b border-gray-200 px-5 py-4">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">
              {product ? "Edit Produk" : "Tambah Produk"}
            </h2>
            <p className="text-sm text-gray-500">
              Lengkapi data produk minimarket.
            </p>
          </div>

          <Button
            variant="icon"
            onClick={onClose}
            aria-label="Tutup form produk"
          >
            <X className="h-5 w-5" />
          </Button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5 p-5">
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="space-y-2">
              <span className="text-sm font-medium text-gray-700">
                Barcode (Opsional)
              </span>
              <div className="flex gap-2">
                <Input
                  value={formValues.barcode}
                  onChange={(event) =>
                    updateField("barcode", event.target.value)
                  }
                />
                {!formValues.barcode.trim() ? (
                  <Button
                    variant="secondary"
                    onClick={handleGenerateBarcode}
                    className="shrink-0"
                  >
                    Generate Barcode
                  </Button>
                ) : null}
              </div>
            </label>

            <label className="space-y-2">
              <span className="text-sm font-medium text-gray-700">
                Nama Produk
              </span>
              <Input
                required
                value={formValues.name}
                onChange={(event) => updateField("name", event.target.value)}
              />
            </label>

            <label className="space-y-2">
              <span className="text-sm font-medium text-gray-700">
                Kategori
              </span>
              <Select
                required
                value={formValues.categoryId ?? ""}
                onChange={(event) => updateCategory(event.target.value)}
              >
                {categories.length === 0 ? (
                  <option value="">Belum ada kategori</option>
                ) : null}
                {categories.map((category) => (
                  <option key={category.id} value={category.id}>
                    {category.name}
                  </option>
                ))}
              </Select>
            </label>

            <label className="space-y-2">
              <span className="text-sm font-medium text-gray-700">Status</span>
              <Select
                value={formValues.status}
                onChange={(event) =>
                  updateField("status", event.target.value as ProductStatus)
                }
              >
                <option value="Aktif">Aktif</option>
                <option value="Nonaktif">Nonaktif</option>
              </Select>
            </label>

            <label className="space-y-2">
              <span className="text-sm font-medium text-gray-700">
                Harga Beli (Opsional)
              </span>
              <Input
                inputMode="numeric"
                value={purchasePriceInput}
                onChange={(event) =>
                  setPurchasePriceInput(
                    event.target.value
                      ? formatRupiah(parseRupiah(event.target.value))
                      : "",
                  )
                }
              />
            </label>

            <label className="space-y-2">
              <span className="text-sm font-medium text-gray-700">
                Harga Jual
              </span>
              <Input
                inputMode="numeric"
                value={sellingPriceInput}
                onChange={(event) =>
                  setSellingPriceInput(
                    event.target.value
                      ? formatRupiah(parseRupiah(event.target.value))
                      : "",
                  )
                }
              />
            </label>

            <label className="space-y-2 sm:col-span-2">
              <span className="text-sm font-medium text-gray-700">Stok</span>
              <Input
                min={0}
                type="number"
                value={stockInput}
                onChange={(event) => setStockInput(event.target.value)}
              />
            </label>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-4">
              <label className="flex items-center gap-2">
                <Input
                  type="checkbox"
                  checked={autoGenerateWhenEmpty}
                  onChange={(event) =>
                    setAutoGenerateWhenEmpty(event.target.checked)
                  }
                  className="h-4 w-4 rounded border-gray-300 p-0"
                />
                <span className="text-sm font-medium text-gray-700">
                  Generate barcode otomatis jika dikosongkan
                </span>
              </label>

              <label className="flex items-center gap-2">
                <Input
                  type="checkbox"
                  checked={printAfterSave}
                  onChange={(event) => setPrintAfterSave(event.target.checked)}
                  className="h-4 w-4 rounded border-gray-300 p-0"
                />
                <span className="text-sm font-medium text-gray-700">
                  Cetak barcode setelah produk disimpan
                </span>
              </label>

              <BarcodePreview barcode={formValues.barcode} />
            </div>

            <BarcodePrintPanel
              settings={printSettings}
              onSettingsChange={setPrintSettings}
              onPrint={handlePrintBarcode}
              disabled={!formValues.barcode.trim()}
            />
          </div>

          {formError ? (
            <p className="rounded-lg bg-red-50 px-3 py-2 text-sm font-medium text-red-700">
              {formError}
            </p>
          ) : null}

          <div className="flex flex-col-reverse gap-3 border-t border-gray-200 pt-5 sm:flex-row sm:justify-end">
            <Button variant="secondary" onClick={onClose} disabled={isSubmitting}>
              Batal
            </Button>
            <Button type="submit" disabled={categories.length === 0 || isSubmitting}>
              {isSubmitting ? "Menyimpan..." : "Simpan Produk"}
            </Button>
          </div>
        </form>
      </Card>
      <BarcodePrintArea payload={printPayload} />
    </div>
  );
}
