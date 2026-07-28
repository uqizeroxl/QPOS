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


