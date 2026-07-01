export type CashierProduct = {
  id: number;
  barcode: string;
  name: string;
  category: string;
  price: number;
  stock: number;
};

export type CartItem = CashierProduct & {
  quantity: number;
};

export type TransactionItem = {
  productId: number;
  barcode: string;
  name: string;
  price: number;
  quantity: number;
  subtotal: number;
};

export type SalesTransaction = {
  id: string;
  transactionNumber: string;
  items: TransactionItem[];
  subtotal: number;
  discountPercent: number;
  discountAmount: number;
  grandTotal: number;
  paidAmount: number;
  change: number;
  cashierName?: string;
  createdAt: string;
};
