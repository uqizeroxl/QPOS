import { X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import type { FormEvent, KeyboardEvent, RefObject } from "react";
import Button from "../../components/ui/Button";
import Card from "../../components/ui/Card";
import { Input, Textarea } from "../../components/ui/Input";
import type { Supplier, SupplierFormValues } from "../../types/supplier";

type SupplierFormProps = {
  isOpen: boolean;
  supplier?: Supplier | null;
  errorMessage?: string;
  onClose: () => void;
  onSubmit: (values: SupplierFormValues) => boolean | Promise<boolean>;
};

const emptyForm: SupplierFormValues = {
  name: "",
  phone: "",
  email: "",
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
    email: supplier.email ?? "",
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
  const [isSubmitting, setIsSubmitting] = useState(false);
  const formRef = useRef<HTMLFormElement>(null);
  const nameInputRef = useRef<HTMLInputElement>(null);
  const phoneInputRef = useRef<HTMLInputElement>(null);
  const emailInputRef = useRef<HTMLInputElement>(null);
  const addressInputRef = useRef<HTMLTextAreaElement>(null);
  const notesInputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (isOpen) {
      nameInputRef.current?.focus();
    }
  }, [isOpen, supplier]);

  useEffect(() => {
    if (!errorMessage) return;

    const firstInvalidField = formRef.current?.querySelector<
      HTMLInputElement | HTMLTextAreaElement
    >("input:invalid, textarea:invalid");

    (firstInvalidField ?? nameInputRef.current)?.focus();
  }, [errorMessage]);

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

  const focusNextOnEnter = (
    event: KeyboardEvent<HTMLInputElement | HTMLTextAreaElement>,
    nextFieldRef: RefObject<HTMLInputElement | HTMLTextAreaElement | null>,
  ) => {
    if (event.key !== "Enter") return;

    event.preventDefault();
    nextFieldRef.current?.focus();
  };

  const handleNotesKeyDown = (event: KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key === "Enter" && event.ctrlKey) {
      event.preventDefault();
      event.currentTarget.form?.requestSubmit();
    }
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (isSubmitting) return;
    setIsSubmitting(true);
    try {
      await onSubmit(formValues);
    } finally {
      setIsSubmitting(false);
    }
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

        <form ref={formRef} onSubmit={handleSubmit} className="space-y-5 p-5">
          <label className="space-y-2">
            <span className="text-sm font-medium text-gray-700">
              Nama Supplier
            </span>
            <Input
              ref={nameInputRef}
              autoFocus
              required
              value={formValues.name}
              onChange={(event) => updateField("name", event.target.value)}
              onKeyDown={(event) =>
                focusNextOnEnter(event, phoneInputRef)
              }
            />
          </label>

          <label className="space-y-2">
            <span className="text-sm font-medium text-gray-700">Telepon</span>
            <Input
              ref={phoneInputRef}
              value={formValues.phone}
              onChange={(event) => updateField("phone", event.target.value)}
              onKeyDown={(event) =>
                focusNextOnEnter(event, emailInputRef)
              }
            />
          </label>

          <label className="space-y-2">
            <span className="text-sm font-medium text-gray-700">Email</span>
            <Input
              ref={emailInputRef}
              type="email"
              value={formValues.email}
              onChange={(event) => updateField("email", event.target.value)}
              onKeyDown={(event) =>
                focusNextOnEnter(event, addressInputRef)
              }
            />
          </label>

          <label className="space-y-2">
            <span className="text-sm font-medium text-gray-700">Alamat</span>
            <Textarea
              ref={addressInputRef}
              rows={3}
              value={formValues.address}
              onChange={(event) => updateField("address", event.target.value)}
              onKeyDown={(event) =>
                focusNextOnEnter(event, notesInputRef)
              }
            />
          </label>

          <label className="space-y-2">
            <span className="text-sm font-medium text-gray-700">Catatan</span>
            <Textarea
              ref={notesInputRef}
              rows={3}
              value={formValues.notes}
              onChange={(event) => updateField("notes", event.target.value)}
              onKeyDown={handleNotesKeyDown}
            />
          </label>

          {errorMessage ? (
            <p className="rounded-lg bg-red-50 px-3 py-2 text-sm font-medium text-red-700">
              {errorMessage}
            </p>
          ) : null}

          <div className="flex flex-col-reverse gap-3 border-t border-gray-200 pt-5 sm:flex-row sm:justify-end">
            <Button variant="secondary" onClick={onClose} disabled={isSubmitting}>
              Batal
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Menyimpan..." : supplier ? "Simpan Perubahan" : "Simpan Supplier"}
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
}
