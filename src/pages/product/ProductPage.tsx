import { Package } from "lucide-react";
import { useMemo, useState } from "react";
import Card from "../../components/ui/Card";
import { useActivityLog } from "../../hooks/useActivityLog";
import { useCategories } from "../../hooks/useCategories";
import { useProducts } from "../../hooks/useProducts";
import MainLayout from "../../layouts/MainLayout";
import ProductForm from "./ProductForm";
import ProductTable from "./ProductTable";
import ProductToolbar from "./ProductToolbar";
import type { Product, ProductFormValues } from "./ProductTypes";
import { getProductUpdateDescription } from "../../utils/productActivity";

const rowsPerPage = 5;
const lowStockThreshold = 5;

export default function ProductPage() {
  const { products, addProduct, updateProduct, deleteProduct } = useProducts();
  const { activeCategoryNames } = useCategories();
  const { addActivity } = useActivityLog();
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("Semua");
  const [currentPage, setCurrentPage] = useState(1);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);

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
    const categoryNames = activeCategoryNames;

    if (editingProduct && !categoryNames.includes(editingProduct.category)) {
      return [editingProduct.category, ...categoryNames];
    }

    return categoryNames;
  }, [activeCategoryNames, editingProduct]);
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

  const handleDeleteProduct = (productId: number) => {
    const deletedProduct = deleteProduct(productId);

    if (deletedProduct) {
      addActivity({
        type: "product-delete",
        title: "Produk berhasil dihapus",
        description: deletedProduct.name,
      });
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

  const handleSubmitProduct = (values: ProductFormValues) => {
    if (editingProduct) {
      const updateDescription = getProductUpdateDescription(editingProduct, values);
      const updatedProduct = updateProduct(editingProduct.id, values);

      if (updatedProduct && updateDescription) {
        addActivity({
          type: "product-update",
          title: "Produk berhasil diperbarui",
          description: updateDescription,
        });
      }

      if (
        updatedProduct &&
        editingProduct.stock !== updatedProduct.stock &&
        updatedProduct.stock < lowStockThreshold
      ) {
        addLowStockActivity(updatedProduct);
      }
    } else {
      const newProduct = addProduct(values);

      addActivity({
        type: "product-create",
        title: "Produk berhasil ditambahkan",
        description: newProduct.name,
      });
      addLowStockActivity(newProduct);
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
              <p className="text-xs">Data produk lokal</p>
            </div>
          </div>
        </Card>

        <ProductToolbar
          searchTerm={searchTerm}
          selectedCategory={selectedCategory}
          categories={formCategories}
          onSearchChange={handleSearchChange}
          onCategoryChange={handleCategoryChange}
          onAddProduct={handleAddProduct}
        />

        <ProductTable
          products={paginatedProducts}
          currentPage={normalizedPage}
          rowsPerPage={rowsPerPage}
          totalProducts={filteredProducts.length}
          onPageChange={setCurrentPage}
          onEdit={handleEditProduct}
          onDelete={handleDeleteProduct}
        />

        {isFormOpen ? (
          <ProductForm
            isOpen={isFormOpen}
            categories={formCategories}
            existingBarcodes={existingBarcodes}
            product={editingProduct}
            onClose={() => {
              setIsFormOpen(false);
              setEditingProduct(null);
            }}
            onSubmit={handleSubmitProduct}
          />
        ) : null}
      </div>
    </MainLayout>
  );
}
