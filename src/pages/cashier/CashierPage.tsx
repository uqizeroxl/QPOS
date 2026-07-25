import { ShoppingCart } from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Card from "../../components/ui/Card";
import { useActivityLog } from "../../hooks/useActivityLog";
import { useAuth } from "../../hooks/useAuth";
import { useProducts } from "../../hooks/useProducts";
import { useTransactions } from "../../hooks/useTransactions";
import { formatRupiah, parseRupiah } from "../../utils/currency";
import MainLayout from "../../layouts/MainLayout";
import BarcodeInput from "./BarcodeInput";
import CartTable from "./CartTable";
import PaymentSuccessDialog from "./PaymentSuccessDialog";
import PaymentSummary from "./PaymentSummary";
import ReceiptPrintArea from "./ReceiptPrintArea";
import type { CartItem, CashierProduct, SalesTransaction } from "./CashierTypes";

function normalizeDiscountPercentInput(value: string) {
  const trimmedValue = value.trim();

  if (trimmedValue.startsWith("-")) {
    return "0";
  }

  const numericValue = trimmedValue.replace(/[^\d]/g, "");

  if (!numericValue) {
    return "0";
  }

  return Math.min(Number(numericValue), 100).toString();
}

export default function CashierPage() {
  const { products, fetchProducts } = useProducts();
  const { addActivity } = useActivityLog();
  const { addTransaction } = useTransactions();
  const { user } = useAuth();
  const [productQuery, setProductQuery] = useState("");
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [discountPercentInput, setDiscountPercentInput] = useState("0");
  const [paidAmountInput, setPaidAmountInput] = useState("0");
  const [barcodeMessage, setBarcodeMessage] = useState("");
  const [transactionMessage, setTransactionMessage] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [paymentDialogTransaction, setPaymentDialogTransaction] =
    useState<SalesTransaction | null>(null);
  const [receiptPrintTransaction, setReceiptPrintTransaction] =
    useState<SalesTransaction | null>(null);
  const [lastSuccessfulTransaction, setLastSuccessfulTransaction] =
    useState<SalesTransaction | null>(null);
  const [focusRequestId, setFocusRequestId] = useState(0);
  const paidAmountInputRef = useRef<HTMLInputElement>(null);
  const cashierProducts = useMemo<CashierProduct[]>(() => {
    return products
      .filter((product) => product.status === "Aktif")
      .map((product) => ({
        id: product.id,
        barcode: product.barcode,
        name: product.name,
        category: product.category,
        price: product.sellingPrice,
        stock: product.stock,
      }));
  }, [products]);

  const subtotal = useMemo(
    () =>
      cartItems.reduce(
        (currentSubtotal, item) => currentSubtotal + item.price * item.quantity,
        0,
      ),
    [cartItems],
  );

  const discountPercent = Number(discountPercentInput);
  const safeDiscountPercent = Number.isFinite(discountPercent)
    ? Math.min(Math.max(discountPercent, 0), 100)
    : 0;
  const discountAmount = Math.round(subtotal * (safeDiscountPercent / 100));
  const paidAmount = parseRupiah(paidAmountInput);
  const total = Math.max(subtotal - discountAmount, 0);
  const change = Math.max(paidAmount - total, 0);
  const canPay = cartItems.length > 0 && paidAmount >= total;

  const requestInputFocus = useCallback(() => {
    setFocusRequestId((currentRequestId) => currentRequestId + 1);
  }, []);

  useEffect(() => {
    const handleAfterPrint = () => {
      setReceiptPrintTransaction(null);
      requestInputFocus();
    };

    window.addEventListener("afterprint", handleAfterPrint);

    return () => {
      window.removeEventListener("afterprint", handleAfterPrint);
    };
  }, [requestInputFocus]);

  useEffect(() => {
    const handleCashierShortcuts = (event: KeyboardEvent) => {
      if (paymentDialogTransaction) {
        return;
      }

      if (event.key === "F9" || (event.ctrlKey && event.key.toLowerCase() === "p")) {
        event.preventDefault();
        paidAmountInputRef.current?.focus();
        paidAmountInputRef.current?.select();
      }
    };

    window.addEventListener("keydown", handleCashierShortcuts);

    return () => {
      window.removeEventListener("keydown", handleCashierShortcuts);
    };
  }, [paymentDialogTransaction]);

  const addProductToCart = (product: CashierProduct) => {
    setCartItems((currentItems) => {
      const existingItem = currentItems.find((item) => item.id === product.id);

      if (existingItem) {
        return currentItems.map((item) =>
          item.id === product.id
            ? {
                ...item,
                quantity: Math.min(item.quantity + 1, item.stock),
              }
            : item,
        );
      }

      return [{ ...product, quantity: 1 }, ...currentItems];
    });

    setProductQuery("");
    setBarcodeMessage("");
    setTransactionMessage("");
    return true;
  };

  const handleAddByQuery = () => {
    const normalizedQuery = productQuery.trim().toLowerCase();
    const product = cashierProducts.find(
      (currentProduct) =>
        currentProduct.barcode.toLowerCase() === normalizedQuery ||
        currentProduct.name.toLowerCase() === normalizedQuery,
    );

    setTransactionMessage("");

    if (!product) {
      setBarcodeMessage("Produk tidak ditemukan.");
      return;
    }

    addProductToCart(product);
  };

  const handleQuantityChange = (productId: number, quantity: number) => {
    setCartItems((currentItems) =>
      currentItems.map((item) =>
        item.id === productId
          ? {
              ...item,
              quantity: Math.min(Math.max(quantity || 1, 1), item.stock),
            }
          : item,
      ),
    );
  };

  const handleRemoveItem = (productId: number) => {
    setCartItems((currentItems) =>
      currentItems.filter((item) => item.id !== productId),
    );
  };

  const validatePayment = () => {
    if (cartItems.length === 0) {
      return "Keranjang masih kosong.";
    }

    if (paidAmount < total) {
      return "Nominal pembayaran belum mencukupi.";
    }

    for (const item of cartItems) {
      const product = products.find(
        (currentProduct) => currentProduct.id === item.id,
      );

      if (!product || product.status !== "Aktif") {
        return `${item.name} tidak tersedia.`;
      }

      if (product.stock < item.quantity) {
        return `Stok ${item.name} tidak mencukupi.`;
      }
    }

    return "";
  };

  const resetCashierState = () => {
    setCartItems([]);
    setDiscountPercentInput("0");
    setPaidAmountInput("0");
    setProductQuery("");
    setBarcodeMessage("");
    setTransactionMessage("");
  };

  const handlePay = async () => {
    const validationMessage = validatePayment();

    if (validationMessage) {
      setTransactionMessage(validationMessage);
      return;
    }

    setIsProcessing(true);
    setTransactionMessage("");

    const result = await addTransaction({
      items: cartItems.map((item) => ({
        productId: item.id,
        barcode: item.barcode,
        name: item.name,
        price: item.price,
        quantity: item.quantity,
        subtotal: item.price * item.quantity,
      })),
      subtotal,
      discountPercent: safeDiscountPercent,
      discountAmount,
      grandTotal: total,
      paidAmount,
      change,
      cashierName: user?.name,
    });

    if (!result.ok) {
      setTransactionMessage(result.error ?? "Gagal memproses transaksi.");
      setIsProcessing(false);
      return;
    }

    const transaction = result.transaction!;

    addActivity({
      type: "transaction-success",
      title: "Transaksi berhasil",
      description: `${transaction.transactionNumber}\n${formatRupiah(
        transaction.grandTotal,
        { prefix: true },
      )}`,
    });
    setLastSuccessfulTransaction(transaction);
    setPaymentDialogTransaction(transaction);
    resetCashierState();
    setIsProcessing(false);

    // refetch products to get updated stock from server
    fetchProducts();
  };

  const handleClosePaymentDialog = () => {
    setPaymentDialogTransaction(null);
    requestInputFocus();
  };

  const printReceipt = (transaction: SalesTransaction) => {
    setPaymentDialogTransaction(null);
    setReceiptPrintTransaction(transaction);
    addActivity({
      type: "receipt-print",
      title: "Struk dicetak",
      description: transaction.transactionNumber,
    });
    window.setTimeout(() => window.print(), 100);
  };

  const handlePrintReceipt = () => {
    if (!lastSuccessfulTransaction) {
      setTransactionMessage("Belum ada transaksi untuk dicetak.");
      return;
    }

    printReceipt(lastSuccessfulTransaction);
  };

  return (
    <MainLayout>
      <div className="space-y-6">
        <Card className="flex flex-col justify-between gap-4 p-5 sm:flex-row sm:items-center">
          <div>
            <p className="text-sm font-medium text-blue-600">
              Transaksi Penjualan
            </p>
            <h1 className="mt-2 text-2xl font-bold text-gray-900 sm:text-3xl">
              Kasir
            </h1>
            <p className="mt-1 text-gray-500">
              Scan barcode, kelola keranjang, dan hitung pembayaran pelanggan.
            </p>
          </div>

          <div className="flex items-center gap-3 rounded-lg bg-blue-50 px-4 py-3 text-blue-700">
            <ShoppingCart className="h-5 w-5" />
            <div>
              <p className="text-sm font-semibold">{cartItems.length} Item</p>
              <p className="text-xs">Keranjang aktif</p>
            </div>
          </div>
        </Card>

        <BarcodeInput
          query={productQuery}
          message={barcodeMessage}
          focusRequestId={focusRequestId}
          products={cashierProducts}
          onProductSelect={addProductToCart}
          onQueryChange={(value) => {
            setProductQuery(value);
            setBarcodeMessage("");
          }}
          onSubmit={handleAddByQuery}
        />

        <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_360px]">
          <CartTable
            items={cartItems}
            onQuantityChange={handleQuantityChange}
            onRemoveItem={handleRemoveItem}
          />

          <PaymentSummary
            ref={paidAmountInputRef}
            subtotal={subtotal}
            discountPercent={discountPercentInput}
            discountAmount={discountAmount}
            total={total}
            paidAmount={paidAmountInput}
            change={change}
            canPay={canPay}
            isProcessing={isProcessing}
            transactionMessage={transactionMessage}
            onDiscountChange={(value) =>
              setDiscountPercentInput(normalizeDiscountPercentInput(value))
            }
            onPaidAmountChange={(value) =>
              setPaidAmountInput(value ? formatRupiah(parseRupiah(value)) : "")
            }
            onPay={handlePay}
            onPrintReceipt={handlePrintReceipt}
          />
        </div>

        <PaymentSuccessDialog
          isOpen={Boolean(paymentDialogTransaction)}
          onClose={handleClosePaymentDialog}
          onPrint={() => {
            if (paymentDialogTransaction) {
              printReceipt(paymentDialogTransaction);
            }
          }}
        />

        <ReceiptPrintArea transaction={receiptPrintTransaction} />
      </div>
    </MainLayout>
  );
}
