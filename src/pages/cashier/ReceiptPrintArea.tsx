import { useSettings } from "../../hooks/useSettings";
import { formatRupiah } from "../../utils/currency";
import type { SalesTransaction } from "../../types/cashier";

type ReceiptPrintAreaProps = {
  transaction: SalesTransaction | null;
};

function formatReceiptDate(value: string) {
  return new Intl.DateTimeFormat("id-ID", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

export default function ReceiptPrintArea({
  transaction,
}: ReceiptPrintAreaProps) {
  const { settings } = useSettings();

  if (!transaction) {
    return null;
  }

  return (
    <div className="receipt-print-root">
      <div className="receipt-ticket">
        <div className="receipt-center">
          <p className="receipt-store-name">{settings.storeName}</p>
          {settings.address ? <p>{settings.address}</p> : null}
          {settings.phone ? <p>{settings.phone}</p> : null}
        </div>

        <div className="receipt-divider" />

        <div className="receipt-row">
          <span>No</span>
          <span>{transaction.transactionNumber}</span>
        </div>
        <div className="receipt-row">
          <span>Tanggal</span>
          <span>{formatReceiptDate(transaction.createdAt)}</span>
        </div>

        <div className="receipt-divider" />

        {transaction.items.map((item) => (
          <div key={`${transaction.id}-${item.productId}`} className="receipt-item">
            <p className="receipt-item-name">{item.name}</p>
            <div className="receipt-row">
              <span>
                {item.quantity} x {formatRupiah(item.price, { prefix: true })}
              </span>
              <span>{formatRupiah(item.subtotal, { prefix: true })}</span>
            </div>
          </div>
        ))}

        <div className="receipt-divider" />

        <div className="receipt-row">
          <span>Subtotal</span>
          <span>{formatRupiah(transaction.subtotal, { prefix: true })}</span>
        </div>
        <div className="receipt-row">
          <span>Diskon ({transaction.discountPercent}%)</span>
          <span>-{formatRupiah(transaction.discountAmount, { prefix: true })}</span>
        </div>
        <div className="receipt-row receipt-total">
          <span>Grand Total</span>
          <span>{formatRupiah(transaction.grandTotal, { prefix: true })}</span>
        </div>
        <div className="receipt-row">
          <span>Bayar</span>
          <span>{formatRupiah(transaction.paidAmount, { prefix: true })}</span>
        </div>
        <div className="receipt-row">
          <span>Kembali</span>
          <span>{formatRupiah(transaction.change, { prefix: true })}</span>
        </div>

        <div className="receipt-divider" />

        <p className="receipt-center receipt-thanks whitespace-pre-line">
          {settings.receiptFooter}
        </p>
      </div>
    </div>
  );
}
