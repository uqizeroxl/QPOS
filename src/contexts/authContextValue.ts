import { createContext } from "react";
import type { AuthUser, LoginPayload, StoreInfo } from "../types/auth";

export type { AuthUser, LoginPayload, StoreInfo } from "../types/auth";

export type AuthContextValue = {
  user: AuthUser | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (payload: LoginPayload) => void;
  logout: () => Promise<void>;
  stores: StoreInfo[];
  switchStore: (storeId: string) => Promise<void>;
};

export const AuthContext = createContext<AuthContextValue | undefined>(
  undefined,
);
