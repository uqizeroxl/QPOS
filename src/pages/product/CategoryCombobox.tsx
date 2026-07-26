import { ChevronDown, Plus } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { Input } from "../../components/ui/Input";
import type { Category } from "../../types/category";

type CategoryComboboxProps = {
  categories: Category[];
  selectedCategoryId?: string;
  selectedCategoryName?: string;
  onSelect: (category: Category) => void;
  onCreate?: (name: string) => Promise<Category>;
  onClearSelection?: () => void;
  allOptionLabel?: string;
  onSelectAll?: () => void;
  emptyMessage?: string;
};

export default function CategoryCombobox({
  categories,
  selectedCategoryId,
  selectedCategoryName,
  onSelect,
  onCreate,
  onClearSelection = () => undefined,
  allOptionLabel,
  onSelectAll,
  emptyMessage = "Kategori tidak ditemukan",
}: CategoryComboboxProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const selectedCategory = categories.find(
    (category) => category.id === selectedCategoryId,
  );
  const selectedLabel = selectedCategory?.name ?? selectedCategoryName ?? "";
  const [query, setQuery] = useState(selectedLabel);
  const [isOpen, setIsOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);
  const [isCreating, setIsCreating] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    setQuery(selectedLabel.toUpperCase());
  }, [selectedLabel]);

  const normalizedQuery = query.trim().toUpperCase();
  const filteredCategories = useMemo(
    () => categories.filter((category) =>
      category.name.toUpperCase().includes(normalizedQuery),
    ),
    [categories, normalizedQuery],
  );
  const showAllOption = Boolean(
    allOptionLabel?.toUpperCase().includes(normalizedQuery),
  );
  const canCreate = Boolean(onCreate && normalizedQuery) &&
    filteredCategories.length === 0 && !showAllOption;
  const optionCount = filteredCategories.length + (showAllOption ? 1 : 0) + (canCreate ? 1 : 0);

  const selectCategory = (category: Category) => {
    onSelect(category);
    setQuery(category.name.toUpperCase());
    setIsOpen(false);
    setErrorMessage("");
    window.requestAnimationFrame(() => inputRef.current?.focus());
  };

  const selectAll = () => {
    onSelectAll?.();
    setQuery(allOptionLabel ?? "");
    setIsOpen(false);
    setErrorMessage("");
    window.requestAnimationFrame(() => inputRef.current?.focus());
  };

  const createCategory = async () => {
    if (!canCreate || isCreating || !onCreate) return;
    setIsCreating(true);
    setErrorMessage("");
    try {
      selectCategory(await onCreate(normalizedQuery));
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : "Kategori gagal ditambahkan.",
      );
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <div className="relative">
      <div className="relative">
        <Input
          ref={inputRef}
          required={Boolean(onCreate)}
          role="combobox"
          aria-expanded={isOpen}
          aria-autocomplete="list"
          value={query}
          onFocus={(event) => {
            setIsOpen(true);
            event.currentTarget.select();
          }}
          onBlur={() => window.setTimeout(() => setIsOpen(false), 0)}
          onChange={(event) => {
            const nextQuery = event.target.value.toUpperCase();
            setQuery(nextQuery);
            if (nextQuery.trim() !== selectedLabel.toUpperCase()) {
              onClearSelection();
            }
            setActiveIndex(0);
            setIsOpen(true);
            setErrorMessage("");
          }}
          onKeyDown={(event) => {
            if (event.key === "ArrowDown") {
              event.preventDefault();
              setIsOpen(true);
              setActiveIndex((index) => Math.min(index + 1, Math.max(optionCount - 1, 0)));
            } else if (event.key === "ArrowUp") {
              event.preventDefault();
              setActiveIndex((index) => Math.max(index - 1, 0));
            } else if (event.key === "Escape") {
              event.preventDefault();
              setIsOpen(false);
            } else if (event.key === "Enter" && isOpen) {
              event.preventDefault();
              if (showAllOption && activeIndex === 0) selectAll();
              else {
                const category = filteredCategories[activeIndex - (showAllOption ? 1 : 0)];
                if (category) selectCategory(category);
                else if (canCreate) void createCategory();
              }
            }
          }}
          autoComplete="off"
          className="pr-10"
        />
        <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
      </div>

      {isOpen ? (
        <div role="listbox" className="absolute z-30 mt-1 max-h-56 w-full overflow-auto rounded-lg border border-gray-200 bg-white p-1 shadow-lg">
          {showAllOption ? (
            <button
              type="button"
              role="option"
              aria-selected={selectedCategoryName === allOptionLabel}
              onMouseDown={(event) => event.preventDefault()}
              onClick={selectAll}
              className={`block w-full rounded-md px-3 py-2 text-left text-sm ${activeIndex === 0 ? "bg-blue-50 text-blue-700" : "text-gray-700 hover:bg-gray-50"}`}
            >
              {allOptionLabel}
            </button>
          ) : null}
          {filteredCategories.map((category, index) => (
            <button
              key={category.id}
              type="button"
              role="option"
              aria-selected={category.id === selectedCategoryId}
              onMouseDown={(event) => event.preventDefault()}
              onClick={() => selectCategory(category)}
              className={`block w-full rounded-md px-3 py-2 text-left text-sm ${index + (showAllOption ? 1 : 0) === activeIndex ? "bg-blue-50 text-blue-700" : "text-gray-700 hover:bg-gray-50"}`}
            >
              {category.name.toUpperCase()}
            </button>
          ))}
          {canCreate ? (
            <button
              type="button"
              onMouseDown={(event) => event.preventDefault()}
              onClick={() => void createCategory()}
              disabled={isCreating}
              className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-left text-sm font-semibold text-blue-700 hover:bg-blue-50 disabled:opacity-50"
            >
              <Plus className="h-4 w-4" />
              + Tambah kategori &quot;{normalizedQuery}&quot;
            </button>
          ) : null}
          {!showAllOption && filteredCategories.length === 0 && !canCreate ? (
            <p className="px-3 py-3 text-center text-sm text-gray-500">{emptyMessage}</p>
          ) : null}
        </div>
      ) : null}
      {errorMessage ? <p className="mt-1 text-xs font-medium text-red-600">{errorMessage}</p> : null}
    </div>
  );
}
