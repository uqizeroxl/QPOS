import { Package, Trash2, X } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import BarcodeScannerModal from "../../components/BarcodeScannerModal";
import Button from "../../components/ui/Button";
import Card from "../../components/ui/Card";
import { useActivityLog } from "../../hooks/useActivityLog";
import { useCategories } from "../../hooks/useCategories";
import { useProducts } from "../../hooks/useProducts";
import { useToast } from "../../hooks/useToast";
import MainLayout from "../../layouts/MainLayout";
import {
  ProductApiError,
  type StockAdjustmentPayload,
  type StockHistoryItem,
} from "../../services/productService";
import ProductForm from "./ProductForm";
import StockAdjustmentModal from "./StockAdjustmentModal";
import StockHistoryModal from "./StockHistoryModal";
import ProductTable from "./ProductTable";
import ProductToolbar from "./ProductToolbar";
import type { BulkProductDraft, Product, ProductFormValues } from "./ProductTypes";
import { getProductUpdateDescription } from "../../utils/productActivity";
import DeleteProductsDialog from "./DeleteProductsDialog";
import BulkUpdateConfirmationDialog from "./BulkUpdateConfirmationDialog";
import { DEFAULT_PAGE_SIZE, PAGE_SIZE_OPTIONS } from "../../constants/pagination";

const productPageSizeKey = "product-page-size";
const lowStockThreshold = 5;

const toBulkDraft = (product: Product): BulkProductDraft => ({
  id: product.id,
  name: product.name,
  barcode: product.barcode,
  purchasePrice: product.purchasePrice,
  sellingPrice: product.sellingPrice,
});

const getInitialPageSize = () => {
  const storedPageSize = Number(sessionStorage.getItem(productPageSizeKey));
  return PAGE_SIZE_OPTIONS.includes(
    storedPageSize as (typeof PAGE_SIZE_OPTIONS)[number],
  )
    ? storedPageSize
    : DEFAULT_PAGE_SIZE;
};

export default function ProductPage() {
  const {
    products,
    totalProducts,
    isLoading,
    errorMessage,
    fetchProducts,
    createProduct,
    updateProduct,
    bulkDeleteProducts,
    bulkUpdateProducts,
    adjustStock,
    getStockHistory,
  } = useProducts();
  const { activeCategories, addCategory } = useCategories();
  const { addActivity } = useActivityLog();
  const { showToast } = useToast();
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("Semua");
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(getInitialPageSize);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [stockProduct, setStockProduct] = useState<Product | null>(null);
  const [historyProduct, setHistoryProduct] = useState<Product | null>(null);
  const [stockHistory, setStockHistory] = useState<StockHistoryItem[]>([]);
  const [isHistoryLoading, setIsHistoryLoading] = useState(false);
  const [selectedProducts, setSelectedProducts] = useState<Product[]>([]);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isDeleteMode, setIsDeleteMode] = useState(false);
  const [isBulkEditMode, setIsBulkEditMode] = useState(false);
  const [bulkDrafts, setBulkDrafts] = useState<Map<string, BulkProductDraft>>(new Map());
  const [bulkOriginals, setBulkOriginals] = useState<Map<string, BulkProductDraft>>(new Map());
  const [isBulkConfirmOpen, setIsBulkConfirmOpen] = useState(false);
  const [isBulkSaving, setIsBulkSaving] = useState(false);
  const [isBarcodeScannerOpen, setIsBarcodeScannerOpen] = useState(false);

  useEffect(() => {
    void fetchProducts({
      page: currentPage,
      limit: rowsPerPage,
      search: searchTerm.trim() || undefined,
      category: selectedCategory === "Semua" ? undefined : selectedCategory,
    });
  }, [
    currentPage,
    fetchProducts,
    rowsPerPage,
    searchTerm,
    selectedCategory,
  ]);

  useEffect(() => {
    if (errorMessage) {
      showToast(errorMessage, "error");
    }
  }, [errorMessage, showToast]);

  const totalPages = Math.ceil(totalProducts / rowsPerPage);
  const normalizedPage = Math.max(1, Math.min(currentPage, totalPages || 1));

  useEffect(() => {
    if (totalPages > 0 && currentPage > totalPages) setCurrentPage(totalPages);
  }, [currentPage, totalPages]);
  const formCategories = useMemo(() => {
    const categoryOptions = activeCategories;

    if (
      editingProduct?.categoryId &&
      !categoryOptions.some((category) => category.id === editingProduct.categoryId)
    ) {
      return [
        {
          id: editingProduct.categoryId,
          name: editingProduct.category,
          description: "",
          productCount: 0,
          status: "Aktif" as const,
          createdAt: "",
          updatedAt: "",
        },
        ...categoryOptions,
      ];
    }

    return categoryOptions;
  }, [activeCategories, editingProduct]);
  const existingBarcodes = products
    .filter((currentProduct) => currentProduct.id !== editingProduct?.id)
    .map((currentProduct) => currentProduct.barcode)
    .filter(Boolean);

  const handleAddProduct = () => {
    setEditingProduct(null);
    setIsFormOpen(true);
  };

  const handleCreateCategory = async (name: string) => {
    const result = await addCategory({
      name,
      description: "",
      status: "Aktif",
    });

    if (!result.ok) throw new Error(result.message);
    showToast("Kategori berhasil ditambahkan.", "success");
    return result.category;
  };

  const startBulkEdit = () => {
    const entries = products.map((product) => [product.id, toBulkDraft(product)] as const);
    setBulkOriginals(new Map(entries));
    setBulkDrafts(new Map(entries));
    setIsBulkEditMode(true);
  };

  useEffect(() => {
    if (!isBulkEditMode) return;

    setBulkOriginals((current) => {
      const next = new Map(current);
      products.forEach((product) => {
        if (!next.has(product.id)) next.set(product.id, toBulkDraft(product));
      });
      return next;
    });
    setBulkDrafts((current) => {
      const next = new Map(current);
      products.forEach((product) => {
        if (!next.has(product.id)) next.set(product.id, toBulkDraft(product));
      });
      return next;
    });
  }, [isBulkEditMode, products]);

  const cancelBulkEdit = () => {
    setIsBulkEditMode(false);
    setBulkDrafts(new Map());
    setBulkOriginals(new Map());
    setIsBulkConfirmOpen(false);
  };

  const updateBulkDraft = (productId: string, changes: Partial<BulkProductDraft>) => {
    setBulkDrafts((current) => {
      const next = new Map(current);
      const draft = next.get(productId);
      if (draft) next.set(productId, { ...draft, ...changes });
      return next;
    });
  };

  const changedBulkDrafts = useMemo(
    () => [...bulkDrafts.values()].map((draft) => ({
      ...draft,
      name: draft.name.trim(),
      barcode: draft.barcode.trim(),
    })).filter((draft) => {
      const original = bulkOriginals.get(draft.id);
      return original && (
        draft.name !== original.name.trim() || draft.barcode !== original.barcode.trim() ||
        draft.purchasePrice !== original.purchasePrice || draft.sellingPrice !== original.sellingPrice
      );
    }),
    [bulkDrafts, bulkOriginals],
  );

  const openBulkConfirmation = () => {
    const invalid = changedBulkDrafts.find((draft) =>
      !draft.name.trim() ||
      draft.purchasePrice === null || !Number.isFinite(draft.purchasePrice) || draft.purchasePrice < 0 ||
      !Number.isFinite(draft.sellingPrice) || draft.sellingPrice < 0,
    );
    if (invalid) {
      showToast("Nama wajib diisi dan harga harus lebih besar atau sama dengan 0.", "error");
      return;
    }
    setIsBulkConfirmOpen(true);
  };

  const saveBulkChanges = async () => {
    setIsBulkSaving(true);
    try {
      const updatedCount = await bulkUpdateProducts(changedBulkDrafts);
      cancelBulkEdit();
      await fetchProducts({
        page: currentPage,
        limit: rowsPerPage,
        search: searchTerm.trim() || undefined,
        category: selectedCategory === "Semua" ? undefined : selectedCategory,
      });
      showToast(`${updatedCount} produk berhasil diperbarui.`, "success");
    } catch (error) {
      showToast(error instanceof ProductApiError ? error.message : error instanceof Error ? error.message : "Produk gagal diperbarui.", "error");
    } finally {
      setIsBulkSaving(false);
    }
  };

  const handleEditProduct = (product: Product) => {
    setEditingProduct(product);
    setIsFormOpen(true);
  };

  const selectedProductIds = useMemo(
    () => new Set(selectedProducts.map((product) => product.id)),
    [selectedProducts],
  );

  const handleSelectionChange = (product: Product, selected: boolean) => {
    setSelectedProducts((current) =>
      selected
        ? current.some((item) => item.id === product.id)
          ? current
          : [...current, product]
        : current.filter((item) => item.id !== product.id),
    );
  };

  const handleSelectPage = (pageProducts: Product[], selected: boolean) => {
    const pageIds = new Set(pageProducts.map((product) => product.id));
    setSelectedProducts((current) =>
      selected
        ? [...current.filter((product) => !pageIds.has(product.id)), ...pageProducts]
        : current.filter((product) => !pageIds.has(product.id)),
    );
  };

  const closeDeleteDialog = useCallback(() => {
    if (!isDeleting) setIsDeleteDialogOpen(false);
  }, [isDeleting]);

  const startDeleteMode = () => {
    setSelectedProducts([]);
    setIsDeleteMode(true);
  };

  const cancelDeleteMode = () => {
    setSelectedProducts([]);
    setIsDeleteDialogOpen(false);
    setIsDeleteMode(false);
  };

  const handleDeleteProducts = async () => {
    const productsToDelete = selectedProducts;
    if (productsToDelete.length === 0) return;

    setIsDeleting(true);
    try {
      const deletedCount = await bulkDeleteProducts(
        productsToDelete.map((product) => product.id),
      );

      showToast(`${deletedCount} produk berhasil dihapus.`, "success");
      addActivity({
        type: "product-delete",
        title: `${deletedCount} produk berhasil dihapus`,
        description: productsToDelete.map((product) => product.name).join(", "),
      });
      setSelectedProducts([]);
      setIsDeleteDialogOpen(false);
      setIsDeleteMode(false);
      await fetchProducts({
        page: currentPage,
        limit: rowsPerPage,
        search: searchTerm.trim() || undefined,
        category: selectedCategory === "Semua" ? undefined : selectedCategory,
      });
    } catch (error) {
      const message =
        error instanceof ProductApiError
          ? error.message
          : error instanceof Error
            ? error.message
            : "Produk gagal dihapus.";

      showToast(message, "error");
    } finally {
      setIsDeleting(false);
    }
  };

  const handleAdjustStock = async (payload: StockAdjustmentPayload) => {
    if (!stockProduct) {
      return false;
    }

    setIsSubmitting(true);

    try {
      const updatedProduct = await adjustStock(stockProduct.id, payload);

      showToast("Stok berhasil disesuaikan.", "success");

      if (updatedProduct.stock < lowStockThreshold) {
        addLowStockActivity(updatedProduct);
      }

      await fetchProducts({
        page: currentPage,
        limit: rowsPerPage,
        search: searchTerm.trim() || undefined,
        category: selectedCategory === "Semua" ? undefined : selectedCategory,
      });
      return true;
    } catch (error) {
      const message =
        error instanceof ProductApiError
          ? error.message
          : "Terjadi kesalahan pada server.";

      showToast(message, "error");
      return false;
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleShowStockHistory = async (product: Product) => {
    setHistoryProduct(product);
    setIsHistoryLoading(true);

    try {
      const history = await getStockHistory(product.id);
      setStockHistory(history);
    } catch (error) {
      const message =
        error instanceof ProductApiError
          ? error.message
          : "Terjadi kesalahan pada server.";

      showToast(message, "error");
      setStockHistory([]);
    } finally {
      setIsHistoryLoading(false);
    }
  };

  const addLowStockActivity = (product: Product) => {
    if (product.stock >= lowStockThreshold) {
      return;
    }

    addActivity({
      type: "stock-minimum",
      title: "Stok minimum",
      description: `${product.name}\nStok tersisa ${product.stock} pcs.`,
    });
  };

  const handleSubmitProduct = async (values: ProductFormValues) => {
    if (editingProduct) {
      setIsSubmitting(true);

      try {
        const updateDescription = getProductUpdateDescription(editingProduct, values);
        const updatedProduct = await updateProduct(editingProduct.id, values);

        showToast("Produk berhasil diperbarui.", "success");

        if (updateDescription) {
          addActivity({
            type: "product-update",
            title: "Produk berhasil diperbarui",
            description: updateDescription,
          });
        }

        if (
          editingProduct.stock !== updatedProduct.stock &&
          updatedProduct.stock < lowStockThreshold
        ) {
          addLowStockActivity(updatedProduct);
        }

        await fetchProducts({
          page: currentPage,
          limit: rowsPerPage,
          search: searchTerm.trim() || undefined,
          category: selectedCategory === "Semua" ? undefined : selectedCategory,
        });

        return true;
      } catch (error) {
        const message =
          error instanceof ProductApiError
            ? error.message
            : "Terjadi kesalahan pada server.";

        showToast(message, "error");
        return false;
      } finally {
        setIsSubmitting(false);
      }
    } else {
      setIsSubmitting(true);

      try {
        const newProduct = await createProduct(values);

        showToast("Produk berhasil ditambahkan.", "success");
        addActivity({
          type: "product-create",
          title: "Produk berhasil ditambahkan",
          description: newProduct.name,
        });
        addLowStockActivity(newProduct);
        await fetchProducts({
          page: currentPage,
          limit: rowsPerPage,
          search: searchTerm.trim() || undefined,
          category: selectedCategory === "Semua" ? undefined : selectedCategory,
        });

        return true;
      } catch (error) {
        const message =
          error instanceof ProductApiError
            ? error.message
            : "Terjadi kesalahan pada server.";

        showToast(message, "error");
        return false;
      } finally {
        setIsSubmitting(false);
      }
    }
  };

  const handleSearchChange = (value: string) => {
    setSearchTerm(value);
    setCurrentPage(1);
  };

  const handleCategoryChange = (value: string) => {
    setSelectedCategory(value);
    setCurrentPage(1);
  };

  const handlePageSizeChange = (value: number) => {
    setRowsPerPage(value);
    setCurrentPage(1);
    sessionStorage.setItem(productPageSizeKey, value.toString());
  };

  return (
    <MainLayout>
      <div className="space-y-6">
        <Card className="flex flex-col justify-between gap-4 p-5 sm:flex-row sm:items-center">
          <div>
            <p className="text-sm font-medium text-blue-600">
              Master Data Produk
            </p>
            <h1 className="mt-2 text-2xl font-bold text-gray-900 sm:text-3xl">
              Produk
            </h1>
            <p className="mt-1 text-gray-500">
              Kelola barcode, harga, stok, dan status produk minimarket.
            </p>
          </div>

          <div className="flex items-center gap-3 rounded-lg bg-blue-50 px-4 py-3 text-blue-700">
            <Package className="h-5 w-5" />
            <div>
              <p className="text-sm font-semibold">{totalProducts} Produk</p>
              <p className="text-xs">Data produk backend</p>
            </div>
          </div>
        </Card>

        <ProductToolbar
          searchTerm={searchTerm}
          selectedCategory={selectedCategory}
          categories={activeCategories}
          onSearchChange={handleSearchChange}
          onScanBarcode={() => setIsBarcodeScannerOpen(true)}
          onCategoryChange={handleCategoryChange}
          onAddProduct={handleAddProduct}
          onBulkEdit={startBulkEdit}
          isBulkEditMode={isBulkEditMode}
          onDeleteMode={startDeleteMode}
          isDeleteMode={isDeleteMode}
        />

        <BarcodeScannerModal
          isOpen={isBarcodeScannerOpen}
          onClose={() => setIsBarcodeScannerOpen(false)}
          onDetected={handleSearchChange}
        />

        {isBulkEditMode ? (
          <Card className="flex flex-col justify-between gap-3 border-blue-200 bg-blue-50 p-4 sm:flex-row sm:items-center">
            <div className="flex flex-wrap items-center gap-2">
              <p className="text-sm font-semibold text-blue-800">Mode Ubah Massal</p>
              <span className="rounded-full bg-blue-100 px-2.5 py-1 text-xs font-semibold text-blue-700">
                Perubahan: {changedBulkDrafts.length} Produk
              </span>
            </div>
            <div className="flex gap-2">
              <Button variant="secondary" onClick={cancelBulkEdit}>Batal</Button>
              <Button onClick={openBulkConfirmation}>Simpan Perubahan Massal</Button>
            </div>
          </Card>
        ) : null}

        {isDeleteMode ? (
          <Card className="flex flex-col justify-between gap-3 border-blue-200 bg-blue-50 p-4 sm:flex-row sm:items-center">
            <p className="text-sm font-semibold text-blue-800">
              {selectedProducts.length} produk dipilih
            </p>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setIsDeleteDialogOpen(true)}
                disabled={selectedProducts.length === 0}
                className="inline-flex h-10 items-center justify-center gap-2 rounded-lg bg-red-600 px-4 text-sm font-semibold text-white transition hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <Trash2 className="h-4 w-4" />
                Hapus Produk
              </button>
              <Button variant="secondary" onClick={cancelDeleteMode}>
                <X className="h-4 w-4" />
                Batal
              </Button>
            </div>
          </Card>
        ) : null}

        <ProductTable
          products={products}
          isLoading={isLoading}
          currentPage={normalizedPage}
          rowsPerPage={rowsPerPage}
          totalProducts={totalProducts}
          onPageChange={setCurrentPage}
          pageSizeOptions={PAGE_SIZE_OPTIONS}
          onPageSizeChange={handlePageSizeChange}
          onEdit={handleEditProduct}
          selectedProductIds={selectedProductIds}
          isDeleteMode={isDeleteMode}
          onSelectionChange={handleSelectionChange}
          onSelectPage={handleSelectPage}
          onAdjustStock={setStockProduct}
          onShowStockHistory={handleShowStockHistory}
          editDrafts={isBulkEditMode ? bulkDrafts : new Map()}
          onDraftChange={updateBulkDraft}
        />

        {isFormOpen ? (
          <ProductForm
            isOpen={isFormOpen}
            categories={formCategories}
            existingBarcodes={existingBarcodes}
            isSubmitting={isSubmitting}
            product={editingProduct}
            onClose={() => {
              setIsFormOpen(false);
              setEditingProduct(null);
            }}
            onSubmit={handleSubmitProduct}
            onCreateCategory={handleCreateCategory}
          />
        ) : null}
        <StockAdjustmentModal
          product={stockProduct}
          isSubmitting={isSubmitting}
          onClose={() => setStockProduct(null)}
          onSubmit={handleAdjustStock}
        />
        <StockHistoryModal
          product={historyProduct}
          history={stockHistory}
          isLoading={isHistoryLoading}
          onClose={() => {
            setHistoryProduct(null);
            setStockHistory([]);
          }}
        />
        {isDeleteDialogOpen ? (
          <DeleteProductsDialog
            products={selectedProducts}
            isSubmitting={isDeleting}
            onClose={closeDeleteDialog}
            onConfirm={() => void handleDeleteProducts()}
          />
        ) : null}
        {isBulkConfirmOpen ? (
          <BulkUpdateConfirmationDialog
            changedCount={changedBulkDrafts.length}
            unchangedCount={bulkDrafts.size - changedBulkDrafts.length}
            isSubmitting={isBulkSaving}
            onClose={() => setIsBulkConfirmOpen(false)}
            onConfirm={() => void saveBulkChanges()}
          />
        ) : null}
      </div>
    </MainLayout>
  );
}
