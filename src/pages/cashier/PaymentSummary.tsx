import { CreditCard, Printer } from "lucide-react";
import { forwardRef } from "react";
import type { KeyboardEvent } from "react";
import Button from "../../components/ui/Button";
import Card from "../../components/ui/Card";
import { Input } from "../../components/ui/Input";
import { formatRupiah } from "../../utils/currency";

type PaymentSummaryProps = {
  subtotal: number;
  discountPercent: string;
  discountAmount: number;
  total: number;
  paidAmount: string;
  change: number;
  canPay: boolean;
  transactionMessage: string;
  onDiscountChange: (value: string) => void;
  onPaidAmountChange: (value: string) => void;
  onPay: () => void;
  onPrintReceipt: () => void;
};

const PaymentSummary = forwardRef<HTMLInputElement, PaymentSummaryProps>(
  function PaymentSummary(
    {
      subtotal,
      discountPercent,
      discountAmount,
      total,
      paidAmount,
      change,
      canPay,
      transactionMessage,
      onDiscountChange,
      onPaidAmountChange,
      onPay,
      onPrintReceipt,
    },
    paidAmountInputRef,
  ) {
    const handlePaidAmountKeyDown = (
      event: KeyboardEvent<HTMLInputElement>,
    ) => {
      if (event.key === "Enter") {
        event.preventDefault();
        onPay();
      }
    };

  return (
    <Card as="aside" className="p-5">
      <div className="flex items-center gap-3">
        <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-blue-50 text-blue-700">
          <CreditCard className="h-5 w-5" />
        </div>
        <div>
          <h2 className="text-lg font-semibold text-gray-900">
            Ringkasan Pembayaran
          </h2>
          <p className="text-sm text-gray-500">Hitung total dan kembalian.</p>
        </div>
      </div>

      <div className="mt-5 space-y-4">
        <div className="flex items-center justify-between text-sm">
          <span className="text-gray-500">Subtotal</span>
          <span className="font-semibold text-gray-900">
            {formatRupiah(subtotal, { prefix: true })}
          </span>
        </div>

        <label className="block space-y-2">
          <span className="text-sm font-medium text-gray-700">Diskon</span>
          <div className="relative">
            <Input
              inputMode="numeric"
              value={discountPercent}
              onChange={(event) => onDiscountChange(event.target.value)}
              className="pr-10"
            />
            <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-sm font-semibold text-gray-500">
              %
            </span>
          </div>
        </label>

        <div className="flex items-center justify-between text-sm">
          <span className="text-gray-500">Diskon ({discountPercent}%)</span>
          <span className="font-semibold text-red-600">
            -{formatRupiah(discountAmount, { prefix: true })}
          </span>
        </div>

        <div className="rounded-lg bg-blue-50 p-4">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-blue-700">
              Grand Total
            </span>
            <span className="text-xl font-bold text-blue-800">
              {formatRupiah(total, { prefix: true })}
            </span>
          </div>
        </div>

        <label className="block space-y-2">
          <span className="text-sm font-medium text-gray-700">
            Uang Dibayar
          </span>
          <Input
            ref={paidAmountInputRef}
            inputMode="numeric"
            value={paidAmount}
            onChange={(event) => onPaidAmountChange(event.target.value)}
            onKeyDown={handlePaidAmountKeyDown}
          />
        </label>

        <div className="flex items-center justify-between rounded-lg border border-gray-200 p-4">
          <span className="text-sm font-medium text-gray-600">Kembalian</span>
          <span className="text-lg font-bold text-gray-900">
            {formatRupiah(change, { prefix: true })}
          </span>
        </div>

        {transactionMessage ? (
          <p className="rounded-lg bg-emerald-50 px-3 py-2 text-sm font-medium text-emerald-700">
            {transactionMessage}
          </p>
        ) : null}

        <div className="grid gap-3 sm:grid-cols-2">
          <Button
            onClick={onPay}
            disabled={!canPay}
          >
            Bayar
          </Button>

          <Button
            variant="secondary"
            onClick={onPrintReceipt}
          >
            <Printer className="h-4 w-4" />
            Cetak Struk
          </Button>
        </div>
      </div>
    </Card>
  );
  },
);

export default PaymentSummary;
