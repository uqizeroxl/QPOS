import { X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import type { FormEvent, KeyboardEvent } from "react";
import Button from "../../components/ui/Button";
import Card from "../../components/ui/Card";
import { Input } from "../../components/ui/Input";
import type { Product } from "../product/ProductTypes";

export type RestockProductValues = {
  quantity: number;
  purchasePrice: number;
  sellingPrice: number;
};

type RestockProductModalProps = {
  product: Product | null;
  onClose: () => void;
  onSave: (values: RestockProductValues) => void;
};

export default function RestockProductModal({
  product,
  onClose,
  onSave,
}: RestockProductModalProps) {
  const [quantity, setQuantity] = useState("1");
  const [purchasePrice, setPurchasePrice] = useState("0");
  const [sellingPrice, setSellingPrice] = useState("0");
  const [errorMessage, setErrorMessage] = useState("");
  const quantityRef = useRef<HTMLInputElement>(null);
  const purchasePriceRef = useRef<HTMLInputElement>(null);
  const sellingPriceRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!product) return;

    setQuantity("1");
    setPurchasePrice(String(product.purchasePrice ?? 0));
    setSellingPrice(String(product.sellingPrice));
    setErrorMessage("");
    window.setTimeout(() => quantityRef.current?.focus(), 0);

    const handleEscape = (event: globalThis.KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        onClose();
      }
    };

    window.addEventListener("keydown", handleEscape);
    return () => window.removeEventListener("keydown", handleEscape);
  }, [onClose, product]);

  if (!product) return null;

  const moveFocusOnEnter = (
    event: KeyboardEvent<HTMLInputElement>,
    nextInput: HTMLInputElement | null,
  ) => {
    if (event.key === "Enter") {
      event.preventDefault();
      nextInput?.focus();
      nextInput?.select();
    }
  };

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const nextQuantity = Number(quantity);
    const nextPurchasePrice = Number(purchasePrice);
    const nextSellingPrice = Number(sellingPrice);

    if (!Number.isInteger(nextQuantity) || nextQuantity <= 0) {
      setErrorMessage("Jumlah restock harus lebih dari 0.");
      quantityRef.current?.focus();
      return;
    }

    if (
      purchasePrice.trim() === "" ||
      !Number.isFinite(nextPurchasePrice) ||
      nextPurchasePrice < 0
    ) {
      setErrorMessage("Harga beli harus 0 atau lebih.");
      purchasePriceRef.current?.focus();
      return;
    }

    if (
      sellingPrice.trim() === "" ||
      !Number.isFinite(nextSellingPrice) ||
      nextSellingPrice < 0
    ) {
      setErrorMessage("Harga jual harus 0 atau lebih.");
      sellingPriceRef.current?.focus();
      return;
    }

    onSave({
      quantity: nextQuantity,
      purchasePrice: nextPurchasePrice,
      sellingPrice: nextSellingPrice,
    });
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900/40 p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="restock-product-title"
    >
      <Card className="w-full max-w-lg border-0 shadow-xl">
        <div className="flex items-center justify-between border-b border-gray-200 px-5 py-4">
          <div>
            <h2 id="restock-product-title" className="text-lg font-semibold text-gray-900">
              Restock Produk
            </h2>
            <p className="mt-1 text-sm text-gray-500">
              Atur jumlah dan harga produk sebelum ditambahkan.
            </p>
          </div>
          <Button variant="icon" onClick={onClose} aria-label="Tutup modal">
            <X className="h-5 w-5" />
          </Button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 p-5">
          <label className="block space-y-2">
            <span className="text-sm font-medium text-gray-700">Nama Produk</span>
            <Input value={product.name} readOnly />
          </label>
          <label className="block space-y-2">
            <span className="text-sm font-medium text-gray-700">Stok Saat Ini</span>
            <Input value={product.stock} readOnly />
          </label>
          <label className="block space-y-2">
            <span className="text-sm font-medium text-gray-700">Jumlah Restock</span>
            <Input
              ref={quantityRef}
              min={1}
              step={1}
              type="number"
              value={quantity}
              onChange={(event) => setQuantity(event.target.value)}
              onKeyDown={(event) => moveFocusOnEnter(event, purchasePriceRef.current)}
            />
          </label>
          <label className="block space-y-2">
            <span className="text-sm font-medium text-gray-700">Harga Beli</span>
            <Input
              ref={purchasePriceRef}
              min={0}
              type="number"
              value={purchasePrice}
              onChange={(event) => setPurchasePrice(event.target.value)}
              onKeyDown={(event) => moveFocusOnEnter(event, sellingPriceRef.current)}
            />
          </label>
          <label className="block space-y-2">
            <span className="text-sm font-medium text-gray-700">Harga Jual</span>
            <Input
              ref={sellingPriceRef}
              min={0}
              type="number"
              value={sellingPrice}
              onChange={(event) => setSellingPrice(event.target.value)}
            />
          </label>

          {errorMessage ? (
            <p className="rounded-lg bg-red-50 px-3 py-2 text-sm font-medium text-red-700">
              {errorMessage}
            </p>
          ) : null}

          <div className="flex justify-end gap-3 border-t border-gray-200 pt-4">
            <Button variant="secondary" onClick={onClose}>Batal</Button>
            <Button type="submit">Simpan Restock</Button>
          </div>
        </form>
      </Card>
    </div>
  );
}
