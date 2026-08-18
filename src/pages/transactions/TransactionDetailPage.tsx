import { ArrowLeft, Printer } from "lucide-react";
import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import Button from "../../components/ui/Button";
import Card from "../../components/ui/Card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeadCell,
  TableRow,
} from "../../components/ui/Table";
import MainLayout from "../../layouts/MainLayout";
import ReceiptPrintArea from "../cashier/ReceiptPrintArea";
import type { SalesTransaction } from "../../types/cashier";
import {
  TransactionApiError,
  transactionService,
} from "../../services/transactionService";
import { formatRupiah } from "../../utils/currency";
import { useReceiptPrinter } from "../../hooks/useReceiptPrinter";

function formatDateTime(value: string) {
  return new Intl.DateTimeFormat("id-ID", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

export default function TransactionDetailPage() {
  const { id } = useParams();
  const [transaction, setTransaction] = useState<SalesTransaction | null>(null);
  const {
    receiptPrintTransaction,
    clearReceiptPrintTransaction,
    printReceipt,
  } = useReceiptPrinter();
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    if (!id) {
      setErrorMessage("Transaksi tidak ditemukan.");
      setIsLoading(false);
      return;
    }

    const fetchTransaction = async () => {
      setIsLoading(true);
      setErrorMessage("");

      try {
        const nextTransaction = await transactionService.getTransactionById(id);
        setTransaction(nextTransaction);
      } catch (error) {
        setErrorMessage(
          error instanceof TransactionApiError
            ? error.message
            : "Terjadi kesalahan pada server.",
        );
      } finally {
        setIsLoading(false);
      }
    };

    void fetchTransaction();
  }, [id]);

  const handlePrintAgain = () => {
    if (!transaction) {
      return;
    }

    printReceipt(transaction);
  };

  return (
    <MainLayout>
      <div className="space-y-6">
        <Card className="flex flex-col justify-between gap-4 p-5 sm:flex-row sm:items-center">
          <div>
            <Link
              to="/transactions"
              className="inline-flex items-center gap-2 text-sm font-medium text-blue-600 hover:text-blue-700"
            >
              <ArrowLeft className="h-4 w-4" />
              Kembali
            </Link>
            <h1 className="mt-3 text-2xl font-bold text-gray-900 sm:text-3xl">
              {transaction?.transactionNumber ?? "Detail Transaksi"}
            </h1>
            <p className="mt-1 text-gray-500">
              Detail invoice dan item transaksi.
            </p>
          </div>

          <Button onClick={handlePrintAgain} disabled={!transaction}>
            <Printer className="h-4 w-4" />
            Print Again
          </Button>
        </Card>

        {isLoading ? (
          <Card className="p-8 text-center">
            <p className="font-semibold text-gray-700">Memuat transaksi...</p>
          </Card>
        ) : errorMessage ? (
          <p className="rounded-lg bg-red-50 px-3 py-2 text-sm font-medium text-red-700">
            {errorMessage}
          </p>
        ) : transaction ? (
          <>
            <Card className="grid gap-4 p-5 text-sm sm:grid-cols-2 lg:grid-cols-4">
              <div>
                <p className="text-gray-500">Tanggal</p>
                <p className="mt-1 font-semibold text-gray-900">
                  {formatDateTime(transaction.createdAt)}
                </p>
              </div>
              <div>
                <p className="text-gray-500">Kasir</p>
                <p className="mt-1 font-semibold text-gray-900">
                  {transaction.cashierName ?? "-"}
                </p>
              </div>
              <div>
                <p className="text-gray-500">Customer</p>
                <p className="mt-1 font-semibold text-gray-900">-</p>
              </div>
              <div>
                <p className="text-gray-500">Metode Pembayaran</p>
                <p className="mt-1 font-semibold text-gray-900">Cash</p>
              </div>
            </Card>

            <Card as="section" className="overflow-hidden">
              <div className="border-b border-gray-200 px-5 py-4">
                <h2 className="text-lg font-semibold text-gray-900">
                  Daftar Item
                </h2>
              </div>
              <div className="overflow-x-auto">
                <Table>
                  <TableHead>
                    <TableRow className="hover:bg-transparent">
                      <TableHeadCell>Produk</TableHeadCell>
                      <TableHeadCell>Qty</TableHeadCell>
                      <TableHeadCell>Harga</TableHeadCell>
                      <TableHeadCell>Subtotal</TableHeadCell>
                    </TableRow>
                  </TableHead>
                  <TableBody className="bg-white">
                    {transaction.items.map((item) => (
                      <TableRow key={`${transaction.id}-${item.productId}`}>
                        <TableCell>
                          <p className="font-semibold text-gray-900">
                            {item.name}
                          </p>
                          <p className="text-sm text-gray-500">{item.barcode}</p>
                        </TableCell>
                        <TableCell className="whitespace-nowrap text-sm text-gray-600">
                          {item.quantity}
                        </TableCell>
                        <TableCell className="whitespace-nowrap text-sm text-gray-600">
                          {formatRupiah(item.price, { prefix: true })}
                        </TableCell>
                        <TableCell className="whitespace-nowrap text-sm font-semibold text-gray-900">
                          {formatRupiah(item.subtotal, { prefix: true })}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </Card>

            <Card className="ml-auto w-full max-w-md space-y-3 p-5 text-sm">
              <div className="flex items-center justify-between">
                <span className="text-gray-500">Subtotal</span>
                <span className="font-semibold text-gray-900">
                  {formatRupiah(transaction.subtotal, { prefix: true })}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-500">Tax</span>
                <span className="font-semibold text-gray-900">
                  {formatRupiah(0, { prefix: true })}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-500">Discount</span>
                <span className="font-semibold text-red-600">
                  -{formatRupiah(transaction.discountAmount, { prefix: true })}
                </span>
              </div>
              <div className="flex items-center justify-between border-t border-gray-200 pt-3">
                <span className="font-semibold text-gray-700">Grand Total</span>
                <span className="text-lg font-bold text-gray-900">
                  {formatRupiah(transaction.grandTotal, { prefix: true })}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-500">Paid Amount</span>
                <span className="font-semibold text-gray-900">
                  {formatRupiah(transaction.paidAmount, { prefix: true })}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-500">Change</span>
                <span className="font-semibold text-gray-900">
                  {formatRupiah(transaction.change, { prefix: true })}
                </span>
              </div>
            </Card>
          </>
        ) : null}

        <ReceiptPrintArea
          transaction={receiptPrintTransaction}
          onClosePreview={clearReceiptPrintTransaction}
        />
      </div>
    </MainLayout>
  );
}
