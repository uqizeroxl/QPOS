import { PackagePlus, Search, Trash2 } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import type { ChangeEvent, FormEvent, KeyboardEvent } from "react";
import MainLayout from "../../layouts/MainLayout";
import Button from "../../components/ui/Button";
import Card from "../../components/ui/Card";
import { Input } from "../../components/ui/Input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeadCell,
  TableRow,
} from "../../components/ui/Table";
import { useActivityLog } from "../../hooks/useActivityLog";
import { useProducts } from "../../hooks/useProducts";
import { useToast } from "../../hooks/useToast";
import { ProductApiError, productService } from "../../services/productService";
import type { Product } from "../product/ProductTypes";
import RestockProductModal from "./RestockProductModal";
import type { RestockProductValues } from "./RestockProductModal";

type RestockItem = Product & {
  restockQuantity: string;
};

export default function RestockPage() {
  const { fetchProducts } = useProducts();
  const { addActivity } = useActivityLog();
  const { showToast } = useToast();
  const [query, setQuery] = useState("");
  const [message, setMessage] = useState("");
  const [items, setItems] = useState<RestockItem[]>([]);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [searchResults, setSearchResults] = useState<Product[]>([]);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const searchRequestRef = useRef(0);
  const normalizedQuery = query.trim().toLowerCase();

  useEffect(() => {
    void fetchProducts();
    inputRef.current?.focus();
  }, [fetchProducts]);

  const matchedProducts = normalizedQuery ? searchResults : [];

  const safeActiveIndex =
    matchedProducts.length === 0
      ? 0
      : Math.min(activeIndex, matchedProducts.length - 1);
  const shouldShowDropdown =
    isDropdownOpen && normalizedQuery.length > 0 && matchedProducts.length > 0;
  const canSubmit =
    items.length > 0 &&
    items.every((item) => {
      const quantity = Number(item.restockQuantity);

      return Number.isInteger(quantity) && quantity > 0;
    });

  const focusInput = useCallback(() => {
    window.setTimeout(() => inputRef.current?.focus(), 0);
  }, []);

  const openRestockModal = useCallback((product: Product) => {
    setSelectedProduct(product);
    setQuery("");
    setMessage("");
    setIsDropdownOpen(false);
    setSearchResults([]);
    searchRequestRef.current += 1;
    setActiveIndex(0);
  }, []);

  const closeRestockModal = useCallback(() => {
    setSelectedProduct(null);
    focusInput();
  }, [focusInput]);

  const saveRestockProduct = useCallback((values: RestockProductValues) => {
    if (!selectedProduct) return;

    setItems((currentItems) => {
      const existingItem = currentItems.find(
        (item) => item.id === selectedProduct.id,
      );

      if (existingItem) {
        return currentItems.map((item) =>
          item.id === selectedProduct.id
            ? {
                ...item,
                restockQuantity: (
                  Math.max(Number(item.restockQuantity) || 0, 0) +
                  values.quantity
                ).toString(),
                purchasePrice: values.purchasePrice,
                sellingPrice: values.sellingPrice,
              }
            : item,
        );
      }

      return [
        {
          ...selectedProduct,
          restockQuantity: values.quantity.toString(),
          purchasePrice: values.purchasePrice,
          sellingPrice: values.sellingPrice,
        },
        ...currentItems,
      ];
    });
    setSelectedProduct(null);
    focusInput();
  }, [focusInput, selectedProduct]);

  useEffect(() => {
    if (!normalizedQuery) {
      setSearchResults([]);
      return;
    }

    const requestId = ++searchRequestRef.current;
    const timeoutId = window.setTimeout(async () => {
      try {
        const products = await productService.searchRestockProducts(query.trim());

        if (requestId !== searchRequestRef.current) return;
        setSearchResults(products);

        const barcodeProduct = products.find(
          (product) => product.barcode.toLowerCase() === normalizedQuery,
        );

        if (barcodeProduct) openRestockModal(barcodeProduct);
      } catch (error) {
        if (requestId !== searchRequestRef.current) return;
        setSearchResults([]);
        setMessage(
          error instanceof ProductApiError
            ? error.message
            : "Terjadi kesalahan pada server.",
        );
      }
    }, 250);

    return () => window.clearTimeout(timeoutId);
  }, [normalizedQuery, openRestockModal, query]);

  const handleQueryChange = (event: ChangeEvent<HTMLInputElement>) => {
    const nextQuery = event.target.value;
    setQuery(nextQuery);
    setMessage("");
    setActiveIndex(0);

    setIsDropdownOpen(true);
  };

  const handleSubmitQuery = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!normalizedQuery) return;

    try {
      const products = await productService.searchRestockProducts(query.trim());
      setSearchResults(products);

      if (products.length === 1) {
        openRestockModal(products[0]);
        return;
      }

      if (products.length > 1) {
        setMessage("Pilih produk yang benar dari daftar hasil.");
        setIsDropdownOpen(true);
        return;
      }

      setMessage("Produk tidak ditemukan.");
      focusInput();
    } catch (error) {
      setMessage(
        error instanceof ProductApiError
          ? error.message
          : "Terjadi kesalahan pada server.",
      );
    }
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "ArrowDown" && shouldShowDropdown) {
      event.preventDefault();
      setActiveIndex((currentIndex) =>
        Math.min(currentIndex + 1, matchedProducts.length - 1),
      );
      return;
    }

    if (event.key === "ArrowUp" && shouldShowDropdown) {
      event.preventDefault();
      setActiveIndex((currentIndex) => Math.max(currentIndex - 1, 0));
      return;
    }

    if (event.key === "Enter" && shouldShowDropdown) {
      event.preventDefault();
      openRestockModal(matchedProducts[safeActiveIndex]);
      return;
    }

    if (event.key === "Escape") {
      setIsDropdownOpen(false);
    }
  };

  const updateQuantity = (productId: string, value: string) => {
    if (!/^\d*$/.test(value)) {
      return;
    }

    setItems((currentItems) =>
      currentItems.map((item) =>
        item.id === productId ? { ...item, restockQuantity: value } : item,
      ),
    );
  };

  const normalizeQuantity = (productId: string) => {
    setItems((currentItems) =>
      currentItems.map((item) => {
        if (item.id !== productId) {
          return item;
        }

        const quantity = Number(item.restockQuantity);

        return Number.isInteger(quantity) && quantity > 0
          ? { ...item, restockQuantity: quantity.toString() }
          : { ...item, restockQuantity: "1" };
      }),
    );
  };

  const normalizeInvalidQuantities = () => {
    setItems((currentItems) =>
      currentItems.map((item) => {
        const quantity = Number(item.restockQuantity);

        return Number.isInteger(quantity) && quantity > 0
          ? { ...item, restockQuantity: quantity.toString() }
          : { ...item, restockQuantity: "1" };
      }),
    );
  };

  const hasInvalidQuantity = () => {
    return items.some((item) => {
      const quantity = Number(item.restockQuantity);

      return !Number.isInteger(quantity) || quantity <= 0;
    });
  };

  const getRestockQuantity = (item: RestockItem) => {
    const quantity = Number(item.restockQuantity);

    return Number.isInteger(quantity) && quantity > 0 ? quantity : 0;
  };

  const getRestockPayloadQuantity = (item: RestockItem) => {
    const quantity = Number(item.restockQuantity);

    return Number.isInteger(quantity) && quantity > 0 ? quantity : 1;
  };

  const resetInvalidQuantitiesBeforeSubmit = () => {
    if (!hasInvalidQuantity()) {
      return false;
    }

    normalizeInvalidQuantities();
    return true;
  };

  const removeItem = (productId: string) => {
    setItems((currentItems) =>
      currentItems.filter((item) => item.id !== productId),
    );
  };

  const handleRestock = async () => {
    if (items.length === 0) {
      setMessage("Daftar restok masih kosong.");
      return;
    }

    if (resetInvalidQuantitiesBeforeSubmit()) {
      setMessage("Qty restok harus lebih dari 0.");
      return;
    }

    const isConfirmed = window.confirm("Konfirmasi restok barang?");

    if (!isConfirmed) {
      return;
    }

    setIsSubmitting(true);
    setMessage("");

    try {
      await productService.restockProducts({
        items: items.map((item) => ({
          productId: item.id,
          quantity: getRestockPayloadQuantity(item),
          purchasePrice: item.purchasePrice ?? 0,
          sellingPrice: item.sellingPrice,
        })),
      });

      showToast("Restok barang berhasil.", "success");
      addActivity({
        type: "stock-restock",
        title: "Restok Barang",
        description: `${items.length} produk berhasil direstok.`,
      });
      setItems([]);
      setQuery("");
      await fetchProducts();
      focusInput();
    } catch (error) {
      const errorMessage =
        error instanceof ProductApiError
          ? error.message
          : "Terjadi kesalahan pada server.";

      setMessage(errorMessage);
      showToast(errorMessage, "error");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <MainLayout>
      <div className="space-y-6">
        <Card className="flex flex-col justify-between gap-4 p-5 sm:flex-row sm:items-center">
          <div>
            <p className="text-sm font-medium text-blue-600">Inventori</p>
            <h1 className="mt-2 text-2xl font-bold text-gray-900 sm:text-3xl">
              Restok Barang
            </h1>
            <p className="mt-1 text-gray-500">
              Scan barcode atau cari produk, lalu tambah stok beberapa barang sekaligus.
            </p>
          </div>

          <div className="flex items-center gap-3 rounded-lg bg-blue-50 px-4 py-3 text-blue-700">
            <PackagePlus className="h-5 w-5" />
            <div>
              <p className="text-sm font-semibold">{items.length} Item</p>
              <p className="text-xs">Daftar restok</p>
            </div>
          </div>
        </Card>

        <Card as="section" className="p-5">
          <div className="flex items-start gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-blue-50 text-blue-700">
              <PackagePlus className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-gray-900">
                Input Barang
              </h2>
              <p className="mt-1 text-sm text-gray-500">
                Produk yang sama akan digabung dalam satu baris restok.
              </p>
            </div>
          </div>

          <form onSubmit={handleSubmitQuery} className="mt-5 flex flex-col gap-3 sm:flex-row">
            <label className="relative flex-1">
              <span className="sr-only">Cari barang</span>
              <Search className="pointer-events-none absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
              <Input
                ref={inputRef}
                value={query}
                onBlur={() => setIsDropdownOpen(false)}
                onChange={handleQueryChange}
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
                          openRestockModal(product);
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
                            {product.barcode || "-"}
                          </span>
                        </span>
                        <span className="shrink-0 text-sm font-semibold text-gray-700">
                          Stok {product.stock}
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

          {message ? (
            <p className="mt-3 rounded-lg bg-red-50 px-3 py-2 text-sm font-medium text-red-700">
              {message}
            </p>
          ) : null}
        </Card>

        <Card as="section" className="overflow-hidden">
          <div className="flex flex-col justify-between gap-3 border-b border-gray-200 px-5 py-4 sm:flex-row sm:items-center">
            <div>
              <h2 className="text-lg font-semibold text-gray-900">
                Daftar Restok
              </h2>
              <p className="mt-1 text-sm text-gray-500">
                Cek qty restok dan stok setelah restok sebelum konfirmasi.
              </p>
            </div>
            <Button
              onClick={handleRestock}
              disabled={!canSubmit || isSubmitting}
              className="sm:w-auto"
            >
              <PackagePlus className="h-4 w-4" />
              {isSubmitting ? "Memproses..." : "Restok Barang"}
            </Button>
          </div>

          <div className="overflow-x-auto">
            <Table>
              <TableHead>
                <TableRow className="hover:bg-transparent">
                  <TableHeadCell>Produk</TableHeadCell>
                  <TableHeadCell>Stok Saat Ini</TableHeadCell>
                  <TableHeadCell>Qty Restok</TableHeadCell>
                  <TableHeadCell>Stok Setelah Restok</TableHeadCell>
                  <TableHeadCell className="text-right">Aksi</TableHeadCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {items.length > 0 ? (
                  items.map((item) => (
                    <TableRow key={item.id}>
                      <TableCell className="min-w-60">
                        <p className="font-semibold text-gray-900">{item.name}</p>
                        <p className="text-sm text-gray-500">
                          {item.barcode || "-"}
                        </p>
                      </TableCell>
                      <TableCell className="whitespace-nowrap text-sm font-semibold text-gray-700">
                        {item.stock}
                      </TableCell>
                      <TableCell className="whitespace-nowrap">
                        <Input
                          min={1}
                          type="number"
                          inputSize="compact"
                          value={item.restockQuantity}
                          onChange={(event) =>
                            updateQuantity(item.id, event.target.value)
                          }
                          onBlur={() => normalizeQuantity(item.id)}
                          className="w-24 text-center font-semibold text-gray-800"
                        />
                      </TableCell>
                      <TableCell className="whitespace-nowrap text-sm font-semibold text-gray-900">
                        {item.stock + getRestockQuantity(item)}
                      </TableCell>
                      <TableCell className="whitespace-nowrap text-right">
                        <Button
                          variant="dangerIcon"
                          onClick={() => removeItem(item.id)}
                          aria-label={`Hapus ${item.name}`}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow className="hover:bg-transparent">
                    <TableCell colSpan={5} className="py-12 text-center">
                      <p className="font-semibold text-gray-700">
                        Daftar restok masih kosong
                      </p>
                      <p className="mt-1 text-sm text-gray-500">
                        Input barcode atau nama produk untuk mulai restok.
                      </p>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </Card>

        <RestockProductModal
          product={selectedProduct}
          onClose={closeRestockModal}
          onSave={saveRestockProduct}
        />
      </div>
    </MainLayout>
  );
}
