import { Printer, RefreshCw, WandSparkles } from "lucide-react";
import Barcode from "react-barcode";
import { useCallback, useEffect, useMemo, useState } from "react";

import Button from "../../components/ui/Button";
import Card from "../../components/ui/Card";
import TablePagination from "../../components/ui/TablePagination";
import { Input, Select } from "../../components/ui/Input";
import { useProducts } from "../../hooks/useProducts";
import { useCategories } from "../../hooks/useCategories";
import MainLayout from "../../layouts/MainLayout";
import { productService } from "../../services/productService";
import { formatRupiah } from "../../utils/currency";
import type { BarcodeLabelSize, Product } from "../../types";
import { DEFAULT_PAGE_SIZE, PAGE_SIZE_OPTIONS } from "../../constants/pagination";

type LabelSettings = {
  quantity: number;
  size: BarcodeLabelSize;
  showName: boolean;
  showPrice: boolean;
  showBarcode: boolean;
  showSku: boolean;
};

const initialSettings: LabelSettings = {
  quantity: 1,
  size: "medium",
  showName: true,
  showPrice: true,
  showBarcode: true,
  showSku: false,
};

const sizeClasses: Record<BarcodeLabelSize, string> = {
  small: "barcode-label-small",
  medium: "barcode-label-medium",
  large: "barcode-label-large",
};

function Label({ product, settings }: { product: Product; settings: LabelSettings }) {
  if (!product.barcode) return null;

  return (
    <div className={`barcode-print-label ${sizeClasses[settings.size]}`}>
      {settings.showName ? <p className="barcode-print-name">{product.name}</p> : null}
      <Barcode value={product.barcode} format="CODE128" width={1.35} height={42} displayValue={false} margin={0} />
      {settings.showBarcode ? <p className="barcode-print-number">{product.barcode}</p> : null}
      {settings.showSku ? <p className="barcode-print-number">SKU: {product.id}</p> : null}
      {settings.showPrice ? <p className="barcode-print-price">{formatRupiah(product.sellingPrice, { prefix: true })}</p> : null}
    </div>
  );
}

export default function BarcodeLabelPage() {
  const { products, totalProducts, isLoading, fetchProducts } = useProducts();
  const { activeCategoryNames } = useCategories();
  const [selectedProducts, setSelectedProducts] = useState<Map<string, Product>>(new Map());
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE);
  const [searchTerm, setSearchTerm] = useState("");
  const [category, setCategory] = useState("Semua");
  const [settings, setSettings] = useState(initialSettings);
  const [isGenerating, setIsGenerating] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState("");

  const fetchPage = useCallback(() => fetchProducts({
    page,
    limit: pageSize,
    search: searchTerm.trim() || undefined,
    category: category === "Semua" ? undefined : category,
  }), [category, fetchProducts, page, pageSize, searchTerm]);

  useEffect(() => {
    void fetchPage();
  }, [fetchPage]);

  const printableProducts = useMemo(
    () => [...selectedProducts.values()].filter((product) => product.barcode),
    [selectedProducts],
  );
  const printableLabels = printableProducts.flatMap((product) =>
    Array.from({ length: settings.quantity }, (_, index) => ({ product, index })),
  );

  const toggleProduct = (product: Product) => {
    setSelectedProducts((current) => {
      const next = new Map(current);
      if (next.has(product.id)) next.delete(product.id);
      else next.set(product.id, product);
      return next;
    });
  };

  const generateBarcode = async (productId: string) => {
    setIsGenerating(productId);
    setErrorMessage("");
    try {
      const updatedProduct = await productService.generateBarcode(productId);
      setSelectedProducts((current) => new Map(current).set(productId, updatedProduct));
      await fetchPage();
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : "Barcode gagal dibuat.",
      );
    } finally {
      setIsGenerating(null);
    }
  };

  return (
    <MainLayout>
      <div className="space-y-6">
        <Card className="flex flex-col justify-between gap-4 p-5 sm:flex-row sm:items-center">
          <div>
            <p className="text-sm font-medium text-blue-600">Produk</p>
            <h1 className="mt-2 text-2xl font-bold text-gray-900 sm:text-3xl">Label Barcode</h1>
            <p className="mt-1 text-gray-500">Pilih produk, atur label, preview, lalu cetak.</p>
          </div>
          <Button onClick={() => void fetchPage()}><RefreshCw className="h-4 w-4" /> Refresh</Button>
        </Card>

        <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_360px]">
          <Card className="p-5">
            <div className="flex items-center justify-between gap-3">
              <h2 className="text-lg font-semibold text-gray-900">Pilih Produk</h2>
              <Button
                variant="compactSecondary"
                onClick={() => setSelectedProducts((current) => {
                  const next = new Map(current);
                  products.filter((product) => product.barcode).forEach((product) => next.set(product.id, product));
                  return next;
                })}
              >
                Pilih Semua
              </Button>
            </div>
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              <Input
                value={searchTerm}
                onChange={(event) => {
                  setSearchTerm(event.target.value);
                  setPage(1);
                }}
                placeholder="Cari nama atau barcode"
              />
              <Select
                value={category}
                onChange={(event) => {
                  setCategory(event.target.value);
                  setPage(1);
                }}
              >
                <option value="Semua">Semua Kategori</option>
                {activeCategoryNames.map((name) => <option key={name} value={name}>{name}</option>)}
              </Select>
            </div>
            {errorMessage ? <p className="mt-4 rounded-lg bg-red-50 px-3 py-2 text-sm font-medium text-red-700">{errorMessage}</p> : null}
            <div className="mt-4 max-h-[520px] space-y-2 overflow-y-auto">
              {isLoading ? <p className="py-10 text-center text-sm text-gray-500">Memuat produk...</p> : products.length ? products.map((product) => (
                <div key={product.id} className="flex items-center gap-3 rounded-lg border border-gray-200 p-3">
                  <Input
                    type="checkbox"
                    checked={selectedProducts.has(product.id)}
                    disabled={!product.barcode}
                    onChange={() => toggleProduct(product)}
                    className="h-4 w-4 p-0"
                  />
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-semibold text-gray-900">{product.name}</p>
                    <p className="text-sm text-gray-500">{product.barcode || "Belum memiliki barcode"}</p>
                  </div>
                  {!product.barcode ? (
                    <Button
                      variant="compactSecondary"
                      disabled={isGenerating === product.id}
                      onClick={() => void generateBarcode(product.id)}
                    >
                      <WandSparkles className="h-4 w-4" /> Generate
                    </Button>
                  ) : null}
                </div>
              )) : <p className="py-10 text-center text-sm text-gray-500">Belum ada produk.</p>}
            </div>
            <TablePagination
              page={page}
              pageSize={pageSize}
              total={totalProducts}
              pageSizeOptions={PAGE_SIZE_OPTIONS}
              onPageChange={setPage}
              onPageSizeChange={(value) => {
                setPageSize(value);
                setPage(1);
              }}
              itemLabel="produk"
            />
          </Card>

          <Card className="h-fit space-y-4 p-5">
            <h2 className="text-lg font-semibold text-gray-900">Pengaturan Label</h2>
            <label className="space-y-2"><span className="text-sm font-medium">Jumlah per produk</span><Input type="number" min={1} max={100} value={settings.quantity} onChange={(event) => setSettings((current) => ({ ...current, quantity: Math.min(100, Math.max(1, Number(event.target.value) || 1)) }))} /></label>
            <label className="space-y-2"><span className="text-sm font-medium">Ukuran</span><Select value={settings.size} onChange={(event) => setSettings((current) => ({ ...current, size: event.target.value as BarcodeLabelSize }))}><option value="small">Kecil</option><option value="medium">Sedang</option><option value="large">Besar</option></Select></label>
            {([
              ["showName", "Nama produk"],
              ["showPrice", "Harga"],
              ["showBarcode", "Nomor barcode"],
              ["showSku", "SKU"],
            ] as const).map(([key, label]) => (
              <label key={key} className="flex items-center gap-2"><Input type="checkbox" checked={settings[key]} onChange={(event) => setSettings((current) => ({ ...current, [key]: event.target.checked }))} className="h-4 w-4 p-0" /><span className="text-sm font-medium">{label}</span></label>
            ))}
            <Button className="w-full" disabled={!printableLabels.length} onClick={() => window.print()}><Printer className="h-4 w-4" /> Cetak {printableLabels.length} Label</Button>
          </Card>
        </div>

        <Card className="p-5">
          <h2 className="text-lg font-semibold text-gray-900">Preview</h2>
          <div className="barcode-label-preview mt-4 flex flex-wrap gap-4 rounded-lg bg-gray-100 p-4">
            {printableLabels.length ? printableLabels.map(({ product, index }) => (
              <div key={`${product.id}-${index}`} className="bg-white"><Label product={product} settings={settings} /></div>
            )) : <p className="text-sm text-gray-500">Pilih produk untuk menampilkan preview.</p>}
          </div>
        </Card>
      </div>

      <div className="barcode-label-page-print-root">
        {printableLabels.map(({ product, index }) => <Label key={`${product.id}-${index}`} product={product} settings={settings} />)}
      </div>
    </MainLayout>
  );
}
