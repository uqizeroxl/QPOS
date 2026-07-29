import { ShoppingCart } from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import BarcodeScannerModal from "../../components/BarcodeScannerModal";
import Card from "../../components/ui/Card";
import { useActivityLog } from "../../hooks/useActivityLog";
import { useAuth } from "../../hooks/useAuth";
import { useProducts } from "../../hooks/useProducts";
import { useToast } from "../../hooks/useToast";
import { useReceiptPrinter } from "../../hooks/useReceiptPrinter";
import {
  TransactionApiError,
  transactionService,
} from "../../services/transactionService";
import { ProductApiError, productService } from "../../services/productService";
import { formatRupiah, parseRupiah } from "../../utils/currency";
import MainLayout from "../../layouts/MainLayout";
import BarcodeInput from "./BarcodeInput";
import CartTable from "./CartTable";
import PaymentSuccessDialog from "./PaymentSuccessDialog";
import PaymentSummary from "./PaymentSummary";
import ReceiptPrintArea from "./ReceiptPrintArea";
import type { CartItem, CashierProduct, SalesTransaction } from "../../types/cashier";

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
  const { fetchProducts } = useProducts();
  const { addActivity } = useActivityLog();
  const { user } = useAuth();
  const { showToast } = useToast();
  const [productQuery, setProductQuery] = useState("");
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [discountPercentInput, setDiscountPercentInput] = useState("0");
  const [paidAmountInput, setPaidAmountInput] = useState("0");
  const [barcodeMessage, setBarcodeMessage] = useState("");
  const [isBarcodeScannerOpen, setIsBarcodeScannerOpen] = useState(false);
  const [isPaying, setIsPaying] = useState(false);
  const [transactionMessage, setTransactionMessage] = useState("");
  const [paymentDialogTransaction, setPaymentDialogTransaction] =
    useState<SalesTransaction | null>(null);
  const [lastSuccessfulTransaction, setLastSuccessfulTransaction] =
    useState<SalesTransaction | null>(null);
  const [focusRequestId, setFocusRequestId] = useState(0);
  const [cashierSearchResults, setCashierSearchResults] = useState<CashierProduct[]>([]);
  const paidAmountInputRef = useRef<HTMLInputElement>(null);
  const productSearchRequestRef = useRef(0);
  const skipSearchEffectForQueryRef = useRef<string | null>(null);
  const checkoutRequestRef = useRef<{
    key: string;
    payload: string;
  } | null>(null);
  const requestInputFocus = useCallback(() => {
    setFocusRequestId((currentRequestId) => currentRequestId + 1);
  }, []);
  const { receiptPrintTransaction, printReceipt: printReceiptArea } =
    useReceiptPrinter(requestInputFocus);
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

  useEffect(() => {
    void fetchProducts();
  }, [fetchProducts]);

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

  const addProductToCart = useCallback((product: CashierProduct) => {
    productSearchRequestRef.current += 1;
    setCartItems((currentItems) => {
      const existingItem = currentItems.find((item) => item.id === product.id);

      if (existingItem) {
        return currentItems.map((item) =>
          item.id === product.id
            ? {
                ...item,
                quantity: item.quantity + 1,
              }
            : item,
        );
      }

      return [{ ...product, quantity: 1 }, ...currentItems];
    });

    setProductQuery("");
    setCashierSearchResults([]);
    setBarcodeMessage("");
    setTransactionMessage("");
    return true;
  }, []);

  useEffect(() => {
    const keyword = productQuery.trim();

    if (skipSearchEffectForQueryRef.current === keyword) {
      skipSearchEffectForQueryRef.current = null;
      return;
    }
    skipSearchEffectForQueryRef.current = null;

    if (!keyword) {
      productSearchRequestRef.current += 1;
      setCashierSearchResults([]);
      return;
    }

    const requestId = ++productSearchRequestRef.current;
    const timeoutId = window.setTimeout(async () => {
      try {
        const products = await productService.searchCashierProducts(keyword);

        if (requestId !== productSearchRequestRef.current) return;

        const results = products.map((product) => ({
          id: product.id,
          barcode: product.barcode,
          name: product.name,
          category: product.category,
          price: product.sellingPrice,
          stock: product.stock,
        }));
        setCashierSearchResults(results);

        const normalizedKeyword = keyword.toLowerCase();
        const barcodeProduct = results.find(
          (product) => product.barcode.toLowerCase() === normalizedKeyword,
        );

        if (barcodeProduct) addProductToCart(barcodeProduct);
      } catch (error) {
        if (requestId !== productSearchRequestRef.current) return;
        setCashierSearchResults([]);
        setBarcodeMessage(
          error instanceof ProductApiError
            ? error.message
            : "Terjadi kesalahan pada server.",
        );
      }
    }, 250);

    return () => window.clearTimeout(timeoutId);
  }, [addProductToCart, productQuery]);

  const handleAddByQuery = async (barcode?: string) => {
    const keyword = (barcode ?? productQuery).trim();
    setTransactionMessage("");

    if (!keyword) return;

    const requestId = ++productSearchRequestRef.current;

    try {
      const products = await productService.searchCashierProducts(keyword);

      if (requestId !== productSearchRequestRef.current) return;

      const results = products.map((product) => ({
        id: product.id,
        barcode: product.barcode,
        name: product.name,
        category: product.category,
        price: product.sellingPrice,
        stock: product.stock,
      }));
      setCashierSearchResults(results);

      if (results.length === 1) {
        addProductToCart(results[0]);
        return;
      }

      if (results.length === 0) {
        setBarcodeMessage("Produk tidak ditemukan.");
      }
    } catch (error) {
      if (requestId !== productSearchRequestRef.current) return;
      setBarcodeMessage(
        error instanceof ProductApiError
          ? error.message
          : "Terjadi kesalahan pada server.",
      );
    }
  };

  const handleBarcodeDetected = (barcode: string) => {
    skipSearchEffectForQueryRef.current = barcode.trim();
    setProductQuery(barcode);
    setBarcodeMessage("");
    void handleAddByQuery(barcode);
  };

  const handleQuantityChange = (productId: string, quantity: number) => {
    setCartItems((currentItems) =>
      currentItems.map((item) =>
        item.id === productId
          ? {
              ...item,
              quantity: Math.max(quantity || 1, 1),
            }
          : item,
      ),
    );
  };

  const handleRemoveItem = (productId: string) => {
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

  const createTransactionPayload = () => {
    return {
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
    };
  };

  const handlePay = async () => {
    if (isPaying) return;
    const validationMessage = validatePayment();

    if (validationMessage) {
      setTransactionMessage(validationMessage);
      return;
    }

    setIsPaying(true);
    try {
      const payload = createTransactionPayload();
      const serializedPayload = JSON.stringify(payload);

      if (checkoutRequestRef.current?.payload !== serializedPayload) {
        checkoutRequestRef.current = {
          key: crypto.randomUUID(),
          payload: serializedPayload,
        };
      }

      const transaction = await transactionService.createTransaction(
        payload,
        checkoutRequestRef.current.key,
      );

      checkoutRequestRef.current = null;

      showToast("Transaksi berhasil.", "success");
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
      await fetchProducts();
    } catch (error) {
      const message =
        error instanceof TransactionApiError
          ? error.message
          : error instanceof Error
            ? error.message
            : "Terjadi kesalahan pada server.";

      setTransactionMessage(message);
      showToast(message, "error");
    } finally {
      setIsPaying(false);
    }
  };

  const handleClosePaymentDialog = () => {
    setPaymentDialogTransaction(null);
    requestInputFocus();
  };

  const printReceipt = (transaction: SalesTransaction) => {
    setPaymentDialogTransaction(null);
    addActivity({
      type: "receipt-print",
      title: "Struk dicetak",
      description: transaction.transactionNumber,
    });
    printReceiptArea(transaction);
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
          products={cashierSearchResults}
          onProductSelect={addProductToCart}
          onQueryChange={(value) => {
            setProductQuery(value);
            setBarcodeMessage("");
          }}
          onSubmit={handleAddByQuery}
          onScanBarcode={() => setIsBarcodeScannerOpen(true)}
        />

        <BarcodeScannerModal
          isOpen={isBarcodeScannerOpen}
          onClose={() => setIsBarcodeScannerOpen(false)}
          onDetected={handleBarcodeDetected}
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
            isPaying={isPaying}
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
