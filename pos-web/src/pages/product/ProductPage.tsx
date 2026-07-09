import { Package } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
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
import type { Product, ProductFormValues } from "./ProductTypes";
import { getProductUpdateDescription } from "../../utils/productActivity";

const rowsPerPage = 5;
const lowStockThreshold = 5;

export default function ProductPage() {
  const {
    products,
    isLoading,
    errorMessage,
    fetchProducts,
    createProduct,
    updateProduct,
    deleteProduct,
    adjustStock,
    getStockHistory,
  } = useProducts();
  const { activeCategories, activeCategoryNames } = useCategories();
  const { addActivity } = useActivityLog();
  const { showToast } = useToast();
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("Semua");
  const [currentPage, setCurrentPage] = useState(1);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [stockProduct, setStockProduct] = useState<Product | null>(null);
  const [historyProduct, setHistoryProduct] = useState<Product | null>(null);
  const [stockHistory, setStockHistory] = useState<StockHistoryItem[]>([]);
  const [isHistoryLoading, setIsHistoryLoading] = useState(false);

  useEffect(() => {
    void fetchProducts();
  }, [fetchProducts]);

  useEffect(() => {
    if (errorMessage) {
      showToast(errorMessage, "error");
    }
  }, [errorMessage, showToast]);

  const filteredProducts = useMemo(() => {
    const normalizedSearch = searchTerm.toLowerCase().trim();

    return products.filter((product) => {
      const matchesSearch =
        product.name.toLowerCase().includes(normalizedSearch) ||
        product.barcode.includes(normalizedSearch);
      const matchesCategory =
        selectedCategory === "Semua" || product.category === selectedCategory;

      return matchesSearch && matchesCategory;
    });
  }, [products, searchTerm, selectedCategory]);

  const totalPages = Math.max(1, Math.ceil(filteredProducts.length / rowsPerPage));
  const normalizedPage = Math.min(currentPage, totalPages);
  const paginatedProducts = filteredProducts.slice(
    (normalizedPage - 1) * rowsPerPage,
    normalizedPage * rowsPerPage,
  );
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
    .map((currentProduct) => currentProduct.barcode);

  const handleAddProduct = () => {
    setEditingProduct(null);
    setIsFormOpen(true);
  };

  const handleEditProduct = (product: Product) => {
    setEditingProduct(product);
    setIsFormOpen(true);
  };

  const handleDeleteProduct = async (productId: string) => {
    try {
      const deletedProduct = await deleteProduct(productId);

      showToast("Produk berhasil dihapus.", "success");
      addActivity({
        type: "product-delete",
        title: "Produk berhasil dihapus",
        description: deletedProduct.name,
      });
      await fetchProducts();
    } catch (error) {
      const message =
        error instanceof ProductApiError
          ? error.message
          : "Terjadi kesalahan pada server.";

      showToast(message, "error");
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

      await fetchProducts();
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

        await fetchProducts();

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
        await fetchProducts();

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
              <p className="text-sm font-semibold">{products.length} Produk</p>
              <p className="text-xs">Data produk backend</p>
            </div>
          </div>
        </Card>

        <ProductToolbar
          searchTerm={searchTerm}
          selectedCategory={selectedCategory}
          categories={activeCategoryNames}
          onSearchChange={handleSearchChange}
          onCategoryChange={handleCategoryChange}
          onAddProduct={handleAddProduct}
        />

        <ProductTable
          products={paginatedProducts}
          isLoading={isLoading}
          currentPage={normalizedPage}
          rowsPerPage={rowsPerPage}
          totalProducts={filteredProducts.length}
          onPageChange={setCurrentPage}
          onEdit={handleEditProduct}
          onDelete={handleDeleteProduct}
          onAdjustStock={setStockProduct}
          onShowStockHistory={handleShowStockHistory}
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
      </div>
    </MainLayout>
  );
}
