import { createContext } from "react";

export type AuthUser = {
  id: string;
  name: string;
  role: "admin" | "manager" | "cashier";
};

export type LoginPayload = {
  token: string;
  user: AuthUser;
};

export type AuthContextValue = {
  user: AuthUser | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (username: string, password: string) => Promise<{ ok: boolean; error?: string }>;
  logout: () => Promise<void>;
};

export const AuthContext = createContext<AuthContextValue | undefined>(
  undefined,
);
