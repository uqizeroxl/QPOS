import { Minus, Plus, Trash2 } from "lucide-react";
import { useState } from "react";
import Button from "../../components/ui/Button";
import Card from "../../components/ui/Card";
import { Input } from "../../components/ui/Input";
import { formatRupiah } from "../../utils/currency";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeadCell,
  TableRow,
} from "../../components/ui/Table";
import type { CartItem } from "./CashierTypes";

type CartTableProps = {
  items: CartItem[];
  onQuantityChange: (productId: string, quantity: number) => void;
  onRemoveItem: (productId: string) => void;
};

export default function CartTable({
  items,
  onQuantityChange,
  onRemoveItem,
}: CartTableProps) {
  const [quantityInputs, setQuantityInputs] = useState<Record<string, string>>(
    {},
  );

  const updateQuantityInput = (
    productId: string,
    value: string,
    maxQuantity: number,
  ) => {
    if (!value) {
      setQuantityInputs((currentInputs) => ({
        ...currentInputs,
        [productId]: "",
      }));
      return;
    }

    const nextQuantity = Math.min(
      Math.max(Number(value) || 1, 1),
      maxQuantity,
    );

    setQuantityInputs((currentInputs) => ({
      ...currentInputs,
      [productId]: nextQuantity.toString(),
    }));
    onQuantityChange(productId, nextQuantity);
  };

  const updateQuantityFromButton = (
    productId: string,
    quantity: number,
    maxQuantity: number,
  ) => {
    const nextQuantity = Math.min(Math.max(quantity, 1), maxQuantity);

    setQuantityInputs((currentInputs) => ({
      ...currentInputs,
      [productId]: nextQuantity.toString(),
    }));
    onQuantityChange(productId, nextQuantity);
  };

  return (
    <Card as="section" className="overflow-hidden">
      <div className="border-b border-gray-200 px-5 py-4">
        <h2 className="text-lg font-semibold text-gray-900">Keranjang</h2>
        <p className="mt-1 text-sm text-gray-500">
          Ubah jumlah atau hapus item sebelum pembayaran.
        </p>
      </div>

      <div className="overflow-x-auto">
        <Table>
          <TableHead>
            <TableRow className="hover:bg-transparent">
              <TableHeadCell>Produk</TableHeadCell>
              <TableHeadCell>Harga</TableHeadCell>
              <TableHeadCell>Jumlah</TableHeadCell>
              <TableHeadCell>Subtotal</TableHeadCell>
              <TableHeadCell className="text-right">Aksi</TableHeadCell>
            </TableRow>
          </TableHead>

          <TableBody>
            {items.length > 0 ? (
              items.map((item) => (
                <TableRow key={item.id}>
                  <TableCell className="min-w-56">
                    <p className="font-semibold text-gray-900">{item.name}</p>
                    <p className="text-sm text-gray-500">{item.barcode}</p>
                  </TableCell>
                  <TableCell className="whitespace-nowrap text-sm font-medium text-gray-700">
                    {formatRupiah(item.price, { prefix: true })}
                  </TableCell>
                  <TableCell className="whitespace-nowrap">
                    <div className="flex items-center gap-2">
                      <Button
                        variant="compactIcon"
                        onClick={() =>
                          updateQuantityFromButton(
                            item.id,
                            item.quantity - 1,
                            item.stock,
                          )
                        }
                        aria-label={`Kurangi ${item.name}`}
                      >
                        <Minus className="h-4 w-4" />
                      </Button>

                      <Input
                        min={1}
                        max={item.stock}
                        type="number"
                        inputSize="compact"
                        value={quantityInputs[item.id] ?? item.quantity.toString()}
                        onChange={(event) =>
                          updateQuantityInput(
                            item.id,
                            event.target.value,
                            item.stock,
                          )
                        }
                        className="w-16 text-center font-semibold text-gray-800"
                      />

                      <Button
                        variant="compactIcon"
                        onClick={() =>
                          updateQuantityFromButton(
                            item.id,
                            item.quantity + 1,
                            item.stock,
                          )
                        }
                        aria-label={`Tambah ${item.name}`}
                      >
                        <Plus className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                  <TableCell className="whitespace-nowrap text-sm font-semibold text-gray-900">
                    {formatRupiah(item.price * item.quantity, { prefix: true })}
                  </TableCell>
                  <TableCell className="whitespace-nowrap text-right">
                    <Button
                      variant="dangerIcon"
                      onClick={() => onRemoveItem(item.id)}
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
                    Keranjang masih kosong
                  </p>
                  <p className="mt-1 text-sm text-gray-500">
                    Input barcode untuk mulai transaksi.
                  </p>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </Card>
  );
}
