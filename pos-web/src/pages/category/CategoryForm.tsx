import { X } from "lucide-react";
import { useState } from "react";
import type { FormEvent } from "react";
import Button from "../../components/ui/Button";
import Card from "../../components/ui/Card";
import { Input, Select, Textarea } from "../../components/ui/Input";
import type {
  Category,
  CategoryFormValues,
  CategoryStatus,
} from "./CategoryTypes";

type CategoryFormProps = {
  isOpen: boolean;
  category?: Category | null;
  errorMessage?: string;
  onClose: () => void;
  onSubmit: (values: CategoryFormValues) => boolean | Promise<boolean>;
};

const emptyForm: CategoryFormValues = {
  name: "",
  description: "",
  status: "Aktif",
};

function getInitialFormValues(category?: Category | null): CategoryFormValues {
  if (!category) {
    return emptyForm;
  }

  return {
    name: category.name,
    description: category.description,
    status: category.status,
  };
}

export default function CategoryForm({
  isOpen,
  category,
  errorMessage,
  onClose,
  onSubmit,
}: CategoryFormProps) {
  const [formValues, setFormValues] = useState<CategoryFormValues>(() =>
    getInitialFormValues(category),
  );

  if (!isOpen) {
    return null;
  }

  const updateField = <Key extends keyof CategoryFormValues>(
    key: Key,
    value: CategoryFormValues[Key],
  ) => {
    setFormValues((currentValues) => ({
      ...currentValues,
      [key]: value,
    }));
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    await onSubmit({
      name: formValues.name,
      description: formValues.description,
      status: formValues.status,
    });
  };

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-gray-900/40 p-4">
      <Card className="max-h-[90vh] w-full max-w-xl overflow-y-auto border-0 shadow-xl">
        <div className="flex items-center justify-between border-b border-gray-200 px-5 py-4">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">
              {category ? "Edit Kategori" : "Tambah Kategori"}
            </h2>
            <p className="text-sm text-gray-500">
              Lengkapi data kategori produk.
            </p>
          </div>

          <Button
            variant="icon"
            onClick={onClose}
            aria-label="Tutup form kategori"
          >
            <X className="h-5 w-5" />
          </Button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5 p-5">
          <label className="space-y-2">
            <span className="text-sm font-medium text-gray-700">
              Nama Kategori
            </span>
            <Input
              required
              maxLength={50}
              value={formValues.name}
              onChange={(event) => updateField("name", event.target.value)}
            />
            <span className="block text-xs font-medium text-gray-400">
              {formValues.name.length}/50 karakter
            </span>
          </label>

          <label className="space-y-2">
            <span className="text-sm font-medium text-gray-700">Deskripsi</span>
            <Textarea
              rows={4}
              value={formValues.description}
              onChange={(event) =>
                updateField("description", event.target.value)
              }
            />
          </label>

          <label className="space-y-2">
            <span className="text-sm font-medium text-gray-700">Status</span>
            <Select
              value={formValues.status}
              onChange={(event) =>
                updateField("status", event.target.value as CategoryStatus)
              }
            >
              <option value="Aktif">Aktif</option>
              <option value="Nonaktif">Nonaktif</option>
            </Select>
          </label>

          {errorMessage ? (
            <p className="rounded-lg bg-red-50 px-3 py-2 text-sm font-medium text-red-700">
              {errorMessage}
            </p>
          ) : null}

          <div className="flex flex-col-reverse gap-3 border-t border-gray-200 pt-5 sm:flex-row sm:justify-end">
            <Button variant="secondary" onClick={onClose}>
              Batal
            </Button>
            <Button type="submit">
              {category ? "Simpan Perubahan" : "Simpan Kategori"}
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
}
