import { Tags } from "lucide-react";
import { useMemo, useState } from "react";
import Card from "../../components/ui/Card";
import { useActivityLog } from "../../hooks/useActivityLog";
import { useCategories } from "../../hooks/useCategories";
import { useToast } from "../../hooks/useToast";
import MainLayout from "../../layouts/MainLayout";
import CategoryForm from "./CategoryForm";
import CategoryTable from "./CategoryTable";
import CategoryToolbar from "./CategoryToolbar";
import type {
  Category,
  CategoryFormValues,
  CategorySortKey,
  SortDirection,
} from "./CategoryTypes";

const rowsPerPage = 5;

function compareText(firstValue: string, secondValue: string) {
  return firstValue.localeCompare(secondValue, "id-ID", {
    sensitivity: "base",
  });
}

export default function CategoryPage() {
  const { categories, addCategory, updateCategory, deleteCategory } =
    useCategories();
  const { addActivity } = useActivityLog();
  const { showToast } = useToast();
  const [searchTerm, setSearchTerm] = useState("");
  const [sortKey, setSortKey] = useState<CategorySortKey>("name");
  const [sortDirection, setSortDirection] = useState<SortDirection>("asc");
  const [currentPage, setCurrentPage] = useState(1);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [formError, setFormError] = useState("");

  const filteredCategories = useMemo(() => {
    const normalizedSearch = searchTerm.toLowerCase().trim();
    const directionMultiplier = sortDirection === "asc" ? 1 : -1;

    return categories
      .filter((category) => {
        if (!normalizedSearch) {
          return true;
        }

        return (
          category.name.toLowerCase().includes(normalizedSearch) ||
          category.description.toLowerCase().includes(normalizedSearch)
        );
      })
      .sort((firstCategory, secondCategory) => {
        if (sortKey === "productCount") {
          return (
            (firstCategory.productCount - secondCategory.productCount) *
            directionMultiplier
          );
        }

        return (
          compareText(
            String(firstCategory[sortKey]),
            String(secondCategory[sortKey]),
          ) * directionMultiplier
        );
      });
  }, [categories, searchTerm, sortDirection, sortKey]);

  const totalPages = Math.max(
    1,
    Math.ceil(filteredCategories.length / rowsPerPage),
  );
  const normalizedPage = Math.min(currentPage, totalPages);
  const paginatedCategories = filteredCategories.slice(
    (normalizedPage - 1) * rowsPerPage,
    normalizedPage * rowsPerPage,
  );

  const openAddForm = () => {
    setEditingCategory(null);
    setFormError("");
    setIsFormOpen(true);
  };

  const openEditForm = (category: Category) => {
    setEditingCategory(category);
    setFormError("");
    setIsFormOpen(true);
  };

  const closeForm = () => {
    setIsFormOpen(false);
    setEditingCategory(null);
    setFormError("");
  };

  const handleSubmitCategory = async (values: CategoryFormValues) => {
    const result = editingCategory
      ? await updateCategory(editingCategory.id, values)
      : await addCategory(values);

    if (!result.ok) {
      setFormError(result.message);
      return false;
    }

    const activityType = editingCategory
      ? "category-update"
      : "category-create";
    const activityTitle = editingCategory
      ? "Kategori berhasil diperbarui"
      : "Kategori berhasil ditambahkan";

    addActivity({
      type: activityType,
      title: activityTitle,
      description: result.category.name,
    });
    showToast(activityTitle);
    closeForm();
    return true;
  };

  const handleDeleteCategory = async (categoryId: number) => {
    const result = await deleteCategory(categoryId);

    if (!result.ok) {
      showToast(result.message, "error");
      return;
    }

    addActivity({
      type: "category-delete",
      title: "Kategori berhasil dihapus",
      description: result.category.name,
    });
    showToast("Kategori berhasil dihapus");
  };

  const handleSearchChange = (value: string) => {
    setSearchTerm(value);
    setCurrentPage(1);
  };

  const handleSortKeyChange = (value: CategorySortKey) => {
    setSortKey(value);
    setCurrentPage(1);
  };

  const handleSortDirectionChange = (value: SortDirection) => {
    setSortDirection(value);
    setCurrentPage(1);
  };

  return (
    <MainLayout>
      <div className="space-y-6">
        <Card className="flex flex-col justify-between gap-4 p-5 sm:flex-row sm:items-center">
          <div>
            <p className="text-sm font-medium text-blue-600">Master Data</p>
            <h1 className="mt-2 text-2xl font-bold text-gray-900 sm:text-3xl">
              Kategori
            </h1>
            <p className="mt-1 text-gray-500">
              Kelola kategori produk untuk memudahkan pencarian barang.
            </p>
          </div>

          <div className="flex items-center gap-3 rounded-lg bg-blue-50 px-4 py-3 text-blue-700">
            <Tags className="h-5 w-5" />
            <div>
              <p className="text-sm font-semibold">
                {categories.length} Kategori
              </p>
              <p className="text-xs">Data kategori lokal</p>
            </div>
          </div>
        </Card>

        <CategoryToolbar
          searchTerm={searchTerm}
          sortKey={sortKey}
          sortDirection={sortDirection}
          onSearchChange={handleSearchChange}
          onSortKeyChange={handleSortKeyChange}
          onSortDirectionChange={handleSortDirectionChange}
          onAddCategory={openAddForm}
        />

        <CategoryTable
          categories={paginatedCategories}
          currentPage={normalizedPage}
          rowsPerPage={rowsPerPage}
          totalCategories={filteredCategories.length}
          onPageChange={setCurrentPage}
          onEdit={openEditForm}
          onDelete={handleDeleteCategory}
        />

        {isFormOpen ? (
          <CategoryForm
            isOpen={isFormOpen}
            category={editingCategory}
            errorMessage={formError}
            onClose={closeForm}
            onSubmit={handleSubmitCategory}
          />
        ) : null}
      </div>
    </MainLayout>
  );
}
