export type StoreRole = "OWNER" | "MANAGER" | "CASHIER";

export type StoreMember = {
  id: string;
  accountId: string;
  role: StoreRole;
  name: string;
  username: string;
  email: string | null;
  createdAt: string;
};

export type AccountSearchResult = {
  id: string;
  username: string;
  name: string;
  email: string | null;
  currentStore: { name: string; role: StoreRole } | null;
};

export const ROLE_LABELS: Record<StoreRole, string> = {
  OWNER: "Pemilik",
  MANAGER: "Admin",
  CASHIER: "Kasir",
};

export const ROLE_COLORS: Record<StoreRole, string> = {
  OWNER: "bg-purple-100 text-purple-700",
  MANAGER: "bg-blue-100 text-blue-700",
  CASHIER: "bg-emerald-100 text-emerald-700",
};
