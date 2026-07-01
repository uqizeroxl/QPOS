import { Package, Search } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import type { ChangeEvent, FormEvent, KeyboardEvent } from "react";
import Button from "../../components/ui/Button";
import Card from "../../components/ui/Card";
import { Input } from "../../components/ui/Input";
import { formatRupiah } from "../../utils/currency";
import type { CashierProduct } from "./CashierTypes";

type BarcodeInputProps = {
  query: string;
  message: string;
  focusRequestId?: number;
  products: CashierProduct[];
  onQueryChange: (value: string) => void;
  onProductSelect: (product: CashierProduct) => boolean;
  onSubmit: () => void;
};

export default function BarcodeInput({
  query,
  message,
  focusRequestId,
  products,
  onQueryChange,
  onProductSelect,
  onSubmit,
}: BarcodeInputProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);
  const normalizedQuery = query.trim().toLowerCase();

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  useEffect(() => {
    inputRef.current?.focus();
  }, [focusRequestId]);

  const matchedProducts = useMemo(() => {
    if (!normalizedQuery) {
      return [];
    }

    return products
      .filter(
        (product) =>
          product.name.toLowerCase().includes(normalizedQuery) ||
          product.barcode.toLowerCase().includes(normalizedQuery),
      )
      .slice(0, 8);
  }, [normalizedQuery, products]);

  const safeActiveIndex =
    matchedProducts.length === 0
      ? 0
      : Math.min(activeIndex, matchedProducts.length - 1);
  const shouldShowDropdown =
    isDropdownOpen && normalizedQuery.length > 0 && matchedProducts.length > 0;
  const shouldShowNotFound =
    normalizedQuery.length > 0 && matchedProducts.length === 0;

  const focusInput = () => {
    window.setTimeout(() => inputRef.current?.focus(), 0);
  };

  const selectProduct = (product: CashierProduct) => {
    const isAdded = onProductSelect(product);

    if (isAdded) {
      setIsDropdownOpen(false);
      setActiveIndex(0);
      focusInput();
    }
  };

  const handleChange = (event: ChangeEvent<HTMLInputElement>) => {
    const nextQuery = event.target.value;
    const nextNormalizedQuery = nextQuery.trim().toLowerCase();
    const exactBarcodeProduct = products.find(
      (product) => product.barcode.toLowerCase() === nextNormalizedQuery,
    );

    onQueryChange(nextQuery);
    setActiveIndex(0);

    if (exactBarcodeProduct) {
      selectProduct(exactBarcodeProduct);
      return;
    }

    setIsDropdownOpen(true);
  };

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    onSubmit();
    focusInput();
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "ArrowDown") {
      if (!shouldShowDropdown) {
        return;
      }

      event.preventDefault();
      setActiveIndex((currentIndex) =>
        Math.min(currentIndex + 1, matchedProducts.length - 1),
      );
      return;
    }

    if (event.key === "ArrowUp") {
      if (!shouldShowDropdown) {
        return;
      }

      event.preventDefault();
      setActiveIndex((currentIndex) => Math.max(currentIndex - 1, 0));
      return;
    }

    if (event.key === "Enter" && shouldShowDropdown) {
      event.preventDefault();
      selectProduct(matchedProducts[safeActiveIndex]);
      return;
    }

    if (event.key === "Escape") {
      setIsDropdownOpen(false);
    }
  };

  return (
    <Card as="section" className="p-5">
      <div className="flex items-start gap-3">
        <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-blue-50 text-blue-700">
          <Package className="h-5 w-5" />
        </div>
        <div>
          <h2 className="text-lg font-semibold text-gray-900">
            Input Barang
          </h2>
          <p className="mt-1 text-sm text-gray-500">
            Scan barcode atau cari nama produk untuk menambahkan ke keranjang.
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="mt-5 flex flex-col gap-3 sm:flex-row">
        <label className="relative flex-1">
          <span className="sr-only">Cari barang</span>
          <Search className="pointer-events-none absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
          <Input
            ref={inputRef}
            value={query}
            onBlur={() => setIsDropdownOpen(false)}
            onChange={handleChange}
            onFocus={() => setIsDropdownOpen(true)}
            onKeyDown={handleKeyDown}
            placeholder="Scan barcode atau ketik nama produk..."
            className="pl-10 pr-3 text-gray-700"
          />

          {shouldShowDropdown ? (
            <div className="absolute left-0 right-0 top-full z-30 mt-2 overflow-hidden rounded-lg border border-gray-200 bg-white shadow-xl">
              {matchedProducts.map((product, index) => {
                const isActive = index === safeActiveIndex;

                return (
                  <button
                    key={product.id}
                    type="button"
                    onMouseDown={(event) => {
                      event.preventDefault();
                      selectProduct(product);
                    }}
                    className={`flex w-full items-start justify-between gap-4 px-4 py-3 text-left transition ${
                      isActive ? "bg-blue-50" : "hover:bg-gray-50"
                    }`}
                  >
                    <span className="min-w-0">
                      <span className="block truncate text-sm font-semibold text-gray-900">
                        {product.name}
                      </span>
                      <span className="mt-1 block text-xs font-medium text-gray-400">
                        {product.barcode}
                      </span>
                    </span>
                    <span className="shrink-0 text-right">
                      <span className="block text-sm font-semibold text-gray-900">
                        {formatRupiah(product.price, { prefix: true })}
                      </span>
                      <span className="mt-1 block text-xs font-medium text-gray-500">
                        Stok {product.stock}
                      </span>
                    </span>
                  </button>
                );
              })}
            </div>
          ) : null}
        </label>

        <Button type="submit" className="px-5">
          Tambah
        </Button>
      </form>

      {message || shouldShowNotFound ? (
        <p className="mt-3 rounded-lg bg-red-50 px-3 py-2 text-sm font-medium text-red-700">
          {message || "Produk tidak ditemukan."}
        </p>
      ) : null}
    </Card>
  );
}
