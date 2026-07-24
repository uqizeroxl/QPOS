import { X } from "lucide-react";
import { useState } from "react";
import type { FormEvent } from "react";
import Button from "../../components/ui/Button";
import Card from "../../components/ui/Card";
import { Input, Textarea } from "../../components/ui/Input";
import type { Supplier, SupplierFormValues } from "./SupplierTypes";

type SupplierFormProps = {
  isOpen: boolean;
  supplier?: Supplier | null;
  errorMessage?: string;
  onClose: () => void;
  onSubmit: (values: SupplierFormValues) => Promise<boolean>;
};

const emptyForm: SupplierFormValues = {
  name: "",
  phone: "",
  address: "",
  notes: "",
};

function getInitialFormValues(supplier?: Supplier | null): SupplierFormValues {
  if (!supplier) {
    return emptyForm;
  }

  return {
    name: supplier.name,
    phone: supplier.phone ?? "",
    address: supplier.address ?? "",
    notes: supplier.notes ?? "",
  };
}

export default function SupplierForm({
  isOpen,
  supplier,
  errorMessage,
  onClose,
  onSubmit,
}: SupplierFormProps) {
  const [formValues, setFormValues] = useState<SupplierFormValues>(() =>
    getInitialFormValues(supplier),
  );

  if (!isOpen) {
    return null;
  }

  const updateField = <Key extends keyof SupplierFormValues>(
    key: Key,
    value: SupplierFormValues[Key],
  ) => {
    setFormValues((currentValues) => ({
      ...currentValues,
      [key]: value,
    }));
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    await onSubmit(formValues);
  };

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-gray-900/40 p-4">
      <Card className="max-h-[90vh] w-full max-w-xl overflow-y-auto border-0 shadow-xl">
        <div className="flex items-center justify-between border-b border-gray-200 px-5 py-4">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">
              {supplier ? "Edit Supplier" : "Tambah Supplier"}
            </h2>
            <p className="text-sm text-gray-500">
              Lengkapi data supplier.
            </p>
          </div>

          <Button
            variant="icon"
            onClick={onClose}
            aria-label="Tutup form supplier"
          >
            <X className="h-5 w-5" />
          </Button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5 p-5">
          <label className="space-y-2">
            <span className="text-sm font-medium text-gray-700">
              Nama Supplier
            </span>
            <Input
              required
              value={formValues.name}
              onChange={(event) => updateField("name", event.target.value)}
            />
          </label>

          <label className="space-y-2">
            <span className="text-sm font-medium text-gray-700">Telepon</span>
            <Input
              value={formValues.phone}
              onChange={(event) => updateField("phone", event.target.value)}
            />
          </label>

          <label className="space-y-2">
            <span className="text-sm font-medium text-gray-700">Alamat</span>
            <Textarea
              rows={3}
              value={formValues.address}
              onChange={(event) => updateField("address", event.target.value)}
            />
          </label>

          <label className="space-y-2">
            <span className="text-sm font-medium text-gray-700">Catatan</span>
            <Textarea
              rows={3}
              value={formValues.notes}
              onChange={(event) => updateField("notes", event.target.value)}
            />
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
              {supplier ? "Simpan Perubahan" : "Simpan Supplier"}
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
}
