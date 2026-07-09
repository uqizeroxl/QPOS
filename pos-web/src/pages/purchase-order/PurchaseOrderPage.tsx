import { Eye, Plus, RefreshCw, Trash2, X } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import Button from "../../components/ui/Button";
import Card from "../../components/ui/Card";
import { Input, Select, Textarea } from "../../components/ui/Input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeadCell,
  TableRow,
} from "../../components/ui/Table";
import { useProducts } from "../../hooks/useProducts";
import { useSuppliers } from "../../hooks/useSuppliers";
import { useToast } from "../../hooks/useToast";
import MainLayout from "../../layouts/MainLayout";
import {
  PurchaseOrderApiError,
  purchaseOrderService,
  type PurchaseOrder,
  type PurchaseOrderPayload,
  type PurchaseOrderStatus,
} from "../../services/purchaseOrderService";
import { formatRupiah } from "../../utils/currency";

type DraftItem = {
  productId: string;
  quantity: string;
  cost: string;
};

const statusLabels: Record<PurchaseOrderStatus, string> = {
  DRAFT: "Draft",
  ORDERED: "Ordered",
  RECEIVED: "Received",
  CANCELLED: "Cancelled",
};

function formatDateTime(value: string) {
  return new Intl.DateTimeFormat("id-ID", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}

function getTotal(purchaseOrder: PurchaseOrder) {
  return purchaseOrder.items.reduce(
    (total, item) => total + item.quantity * item.cost,
    0,
  );
}

export default function PurchaseOrderPage() {
  const { products, fetchProducts } = useProducts();
  const { suppliers, fetchSuppliers } = useSuppliers();
  const { showToast } = useToast();
  const [purchaseOrders, setPurchaseOrders] = useState<PurchaseOrder[]>([]);
  const [selectedPurchaseOrder, setSelectedPurchaseOrder] =
    useState<PurchaseOrder | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [supplierId, setSupplierId] = useState("");
  const [note, setNote] = useState("");
  const [items, setItems] = useState<DraftItem[]>([
    { productId: "", quantity: "1", cost: "0" },
  ]);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const activeSuppliers = useMemo(
    () => suppliers.filter((supplier) => supplier.isActive),
    [suppliers],
  );

  const fetchPurchaseOrders = async () => {
    setIsLoading(true);
    setErrorMessage("");

    try {
      const nextPurchaseOrders = await purchaseOrderService.getPurchaseOrders();
      setPurchaseOrders(nextPurchaseOrders);
    } catch (error) {
      setErrorMessage(
        error instanceof PurchaseOrderApiError
          ? error.message
          : "Terjadi kesalahan pada server.",
      );
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    void fetchPurchaseOrders();
    void fetchProducts();
    void fetchSuppliers();
  }, [fetchProducts, fetchSuppliers]);

  const resetForm = () => {
    setSupplierId("");
    setNote("");
    setItems([{ productId: "", quantity: "1", cost: "0" }]);
  };

  const buildPayload = (): PurchaseOrderPayload | null => {
    const normalizedItems = items.map((item) => ({
      productId: item.productId,
      quantity: Number(item.quantity),
      cost: Number(item.cost),
    }));

    if (!supplierId) {
      showToast("Supplier wajib dipilih.", "error");
      return null;
    }

    if (
      normalizedItems.some(
        (item) =>
          !item.productId ||
          !Number.isInteger(item.quantity) ||
          item.quantity <= 0 ||
          Number.isNaN(item.cost) ||
          item.cost < 0,
      )
    ) {
      showToast("Item PO belum valid.", "error");
      return null;
    }

    return {
      supplierId,
      note,
      items: normalizedItems,
    };
  };

  const handleCreate = async () => {
    const payload = buildPayload();

    if (!payload) return;

    try {
      await purchaseOrderService.createPurchaseOrder(payload);
      showToast("Purchase Order berhasil dibuat.", "success");
      resetForm();
      setIsFormOpen(false);
      await fetchPurchaseOrders();
    } catch (error) {
      showToast(
        error instanceof PurchaseOrderApiError
          ? error.message
          : "Terjadi kesalahan pada server.",
        "error",
      );
    }
  };

  const handleStatusChange = async (
    purchaseOrder: PurchaseOrder,
    status: PurchaseOrderStatus,
  ) => {
    try {
      const updatedPurchaseOrder = await purchaseOrderService.changeStatus(
        purchaseOrder.id,
        status,
      );

      showToast("Status PO berhasil diubah.", "success");
      setSelectedPurchaseOrder(updatedPurchaseOrder);
      await fetchPurchaseOrders();

      if (status === "RECEIVED") {
        await fetchProducts();
      }
    } catch (error) {
      showToast(
        error instanceof PurchaseOrderApiError
          ? error.message
          : "Terjadi kesalahan pada server.",
        "error",
      );
    }
  };

  const handleDelete = async (purchaseOrder: PurchaseOrder) => {
    const isConfirmed = window.confirm(`Hapus ${purchaseOrder.poNumber}?`);

    if (!isConfirmed) return;

    try {
      await purchaseOrderService.deletePurchaseOrder(purchaseOrder.id);
      showToast("Purchase Order berhasil dihapus.", "success");
      await fetchPurchaseOrders();
    } catch (error) {
      showToast(
        error instanceof PurchaseOrderApiError
          ? error.message
          : "Terjadi kesalahan pada server.",
        "error",
      );
    }
  };

  const updateItem = (
    index: number,
    key: keyof DraftItem,
    value: string,
  ) => {
    setItems((currentItems) =>
      currentItems.map((item, itemIndex) =>
        itemIndex === index ? { ...item, [key]: value } : item,
      ),
    );
  };

  return (
    <MainLayout>
      <div className="space-y-6">
        <Card className="flex flex-col justify-between gap-4 p-5 sm:flex-row sm:items-center">
          <div>
            <p className="text-sm font-medium text-blue-600">Pembelian</p>
            <h1 className="mt-2 text-2xl font-bold text-gray-900 sm:text-3xl">
              Purchase Order
            </h1>
            <p className="mt-1 text-gray-500">
              Buat PO, pantau status, dan terima stok dari supplier.
            </p>
          </div>

          <div className="flex gap-3">
            <Button variant="secondary" onClick={fetchPurchaseOrders}>
              <RefreshCw className="h-4 w-4" />
              Refresh
            </Button>
            <Button onClick={() => setIsFormOpen(true)}>
              <Plus className="h-4 w-4" />
              Buat PO
            </Button>
          </div>
        </Card>

        {errorMessage ? (
          <p className="rounded-lg bg-red-50 px-3 py-2 text-sm font-medium text-red-700">
            {errorMessage}
          </p>
        ) : null}

        <Card as="section" className="overflow-hidden">
          <div className="overflow-x-auto">
            <Table>
              <TableHead>
                <TableRow className="hover:bg-transparent">
                  <TableHeadCell>No PO</TableHeadCell>
                  <TableHeadCell>Tanggal</TableHeadCell>
                  <TableHeadCell>Supplier</TableHeadCell>
                  <TableHeadCell>Status</TableHeadCell>
                  <TableHeadCell>Total</TableHeadCell>
                  <TableHeadCell className="text-right">Aksi</TableHeadCell>
                </TableRow>
              </TableHead>
              <TableBody className="bg-white">
                {isLoading ? (
                  <TableRow className="hover:bg-transparent">
                    <TableCell colSpan={6} className="py-12 text-center">
                      <p className="font-semibold text-gray-700">Memuat...</p>
                    </TableCell>
                  </TableRow>
                ) : purchaseOrders.length > 0 ? (
                  purchaseOrders.map((purchaseOrder) => (
                    <TableRow key={purchaseOrder.id}>
                      <TableCell className="whitespace-nowrap font-semibold text-gray-900">
                        {purchaseOrder.poNumber}
                      </TableCell>
                      <TableCell className="whitespace-nowrap text-sm text-gray-600">
                        {formatDateTime(purchaseOrder.createdAt)}
                      </TableCell>
                      <TableCell className="whitespace-nowrap text-sm text-gray-600">
                        {purchaseOrder.supplier.name}
                      </TableCell>
                      <TableCell className="whitespace-nowrap text-sm font-semibold text-gray-900">
                        {statusLabels[purchaseOrder.status]}
                      </TableCell>
                      <TableCell className="whitespace-nowrap text-sm font-semibold text-gray-900">
                        {formatRupiah(getTotal(purchaseOrder), { prefix: true })}
                      </TableCell>
                      <TableCell className="whitespace-nowrap text-right">
                        <div className="inline-flex gap-2">
                          <Button
                            variant="compactSecondary"
                            onClick={() => setSelectedPurchaseOrder(purchaseOrder)}
                          >
                            <Eye className="h-4 w-4" />
                            Detail
                          </Button>
                          <Button
                            variant="dangerIcon"
                            onClick={() => handleDelete(purchaseOrder)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow className="hover:bg-transparent">
                    <TableCell colSpan={6} className="py-12 text-center">
                      <p className="font-semibold text-gray-700">
                        Belum ada Purchase Order.
                      </p>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </Card>

        {isFormOpen ? (
          <div className="fixed inset-0 z-40 flex items-center justify-center bg-gray-900/40 p-4">
            <Card className="max-h-[90vh] w-full max-w-3xl overflow-y-auto border-0 shadow-xl">
              <div className="flex items-center justify-between border-b border-gray-200 px-5 py-4">
                <div>
                  <h2 className="text-lg font-semibold text-gray-900">
                    Buat Purchase Order
                  </h2>
                  <p className="text-sm text-gray-500">
                    Pilih supplier dan produk yang dipesan.
                  </p>
                </div>
                <Button
                  variant="icon"
                  onClick={() => setIsFormOpen(false)}
                  aria-label="Tutup"
                >
                  <X className="h-5 w-5" />
                </Button>
              </div>

              <div className="space-y-4 p-5">
                <label className="space-y-2">
                  <span className="text-sm font-medium text-gray-700">
                    Supplier
                  </span>
                  <Select
                    value={supplierId}
                    onChange={(event) => setSupplierId(event.target.value)}
                  >
                    <option value="">Pilih supplier</option>
                    {activeSuppliers.map((supplier) => (
                      <option key={supplier.id} value={supplier.id}>
                        {supplier.name}
                      </option>
                    ))}
                  </Select>
                </label>

                <div className="space-y-3">
                  {items.map((item, index) => (
                    <div
                      key={index}
                      className="grid gap-3 rounded-lg border border-gray-200 p-3 md:grid-cols-[minmax(0,1fr)_120px_160px_40px]"
                    >
                      <Select
                        value={item.productId}
                        onChange={(event) =>
                          updateItem(index, "productId", event.target.value)
                        }
                      >
                        <option value="">Pilih produk</option>
                        {products.map((product) => (
                          <option key={product.id} value={product.id}>
                            {product.name}
                          </option>
                        ))}
                      </Select>
                      <Input
                        min={1}
                        type="number"
                        value={item.quantity}
                        onChange={(event) =>
                          updateItem(index, "quantity", event.target.value)
                        }
                      />
                      <Input
                        min={0}
                        type="number"
                        value={item.cost}
                        onChange={(event) =>
                          updateItem(index, "cost", event.target.value)
                        }
                      />
                      <Button
                        variant="dangerIcon"
                        onClick={() =>
                          setItems((currentItems) =>
                            currentItems.filter((_, itemIndex) => itemIndex !== index),
                          )
                        }
                        disabled={items.length === 1}
                        aria-label="Hapus item"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>

                <Button
                  variant="secondary"
                  onClick={() =>
                    setItems((currentItems) => [
                      ...currentItems,
                      { productId: "", quantity: "1", cost: "0" },
                    ])
                  }
                >
                  <Plus className="h-4 w-4" />
                  Tambah Item
                </Button>

                <label className="space-y-2">
                  <span className="text-sm font-medium text-gray-700">
                    Catatan
                  </span>
                  <Textarea
                    rows={3}
                    value={note}
                    onChange={(event) => setNote(event.target.value)}
                  />
                </label>

                <div className="flex justify-end gap-3 border-t border-gray-200 pt-4">
                  <Button variant="secondary" onClick={() => setIsFormOpen(false)}>
                    Batal
                  </Button>
                  <Button onClick={handleCreate}>Simpan PO</Button>
                </div>
              </div>
            </Card>
          </div>
        ) : null}

        {selectedPurchaseOrder ? (
          <div className="fixed inset-0 z-40 flex items-center justify-center bg-gray-900/40 p-4">
            <Card className="max-h-[90vh] w-full max-w-3xl overflow-y-auto border-0 shadow-xl">
              <div className="flex flex-col justify-between gap-3 border-b border-gray-200 px-5 py-4 sm:flex-row sm:items-center">
                <div>
                  <h2 className="text-lg font-semibold text-gray-900">
                    {selectedPurchaseOrder.poNumber}
                  </h2>
                  <p className="text-sm text-gray-500">
                    {selectedPurchaseOrder.supplier.name}
                  </p>
                </div>
                <div className="flex gap-3">
                  <Select
                    value={selectedPurchaseOrder.status}
                    onChange={(event) =>
                      handleStatusChange(
                        selectedPurchaseOrder,
                        event.target.value as PurchaseOrderStatus,
                      )
                    }
                  >
                    <option value="DRAFT">Draft</option>
                    <option value="ORDERED">Ordered</option>
                    <option value="RECEIVED">Received</option>
                    <option value="CANCELLED">Cancelled</option>
                  </Select>
                  <Button
                    variant="secondary"
                    onClick={() => setSelectedPurchaseOrder(null)}
                  >
                    Tutup
                  </Button>
                </div>
              </div>

              <div className="overflow-x-auto">
                <Table>
                  <TableHead>
                    <TableRow className="hover:bg-transparent">
                      <TableHeadCell>Produk</TableHeadCell>
                      <TableHeadCell>Qty</TableHeadCell>
                      <TableHeadCell>Cost</TableHeadCell>
                      <TableHeadCell>Subtotal</TableHeadCell>
                    </TableRow>
                  </TableHead>
                  <TableBody className="bg-white">
                    {selectedPurchaseOrder.items.map((item) => (
                      <TableRow key={item.id}>
                        <TableCell>
                          <p className="font-semibold text-gray-900">
                            {item.product.name}
                          </p>
                          <p className="text-sm text-gray-500">
                            {item.product.barcode}
                          </p>
                        </TableCell>
                        <TableCell>{item.quantity}</TableCell>
                        <TableCell>
                          {formatRupiah(item.cost, { prefix: true })}
                        </TableCell>
                        <TableCell className="font-semibold">
                          {formatRupiah(item.quantity * item.cost, {
                            prefix: true,
                          })}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              <div className="border-t border-gray-200 p-5 text-right">
                <p className="text-sm text-gray-500">Total</p>
                <p className="text-xl font-bold text-gray-900">
                  {formatRupiah(getTotal(selectedPurchaseOrder), {
                    prefix: true,
                  })}
                </p>
              </div>
            </Card>
          </div>
        ) : null}
      </div>
    </MainLayout>
  );
}
