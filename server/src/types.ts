export type UserRole = "admin" | "manager" | "cashier";
export type EntityStatus = "Aktif" | "Nonaktif";

export type User = {
  id: string;
  username: string;
  password: string;
  name: string;
  role: UserRole;
  createdAt: string;
  updatedAt: string;
};

export type UserPublic = Omit<User, "password">;

export type Category = {
  id: number;
  name: string;
  description: string;
  status: EntityStatus;
  productCount: number;
  createdAt: string;
  updatedAt: string;
};

export type Product = {
  id: number;
  barcode: string;
  name: string;
  category: string;
  purchasePrice: number;
  sellingPrice: number;
  stock: number;
  status: EntityStatus;
};

export type Supplier = {
  id: number;
  name: string;
  phone: string;
  address: string;
  notes: string;
  createdAt: string;
  updatedAt: string;
};

export type TransactionItem = {
  productId: number;
  barcode: string;
  name: string;
  price: number;
  quantity: number;
  subtotal: number;
};

export type Transaction = {
  id: string;
  transactionNumber: string;
  items: TransactionItem[];
  subtotal: number;
  discountPercent: number;
  discountAmount: number;
  grandTotal: number;
  paidAmount: number;
  change: number;
  cashierName: string;
  createdAt: string;
};

export type AppSettings = {
  storeName: string;
  phone: string;
  address: string;
};

export type LoginRequest = {
  username: string;
  password: string;
};

export type LoginResponse = {
  token: string;
  user: UserPublic;
};

export type ApiResponse<T> = {
  status: "success" | "error";
  data: T;
  message?: string;
};

export type PaginationQuery = {
  page?: number;
  limit?: number;
  sort?: string;
  order?: "asc" | "desc";
  search?: string;
};

export type PaginatedResponse<T> = {
  items: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
};