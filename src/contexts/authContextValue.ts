import { createContext } from "react";
import type { AuthUser, LoginPayload } from "../types/auth";

export type { AuthUser, LoginPayload } from "../types/auth";

export type AuthContextValue = {
  user: AuthUser | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (payload: LoginPayload) => void;
  logout: () => Promise<void>;
};

export const AuthContext = createContext<AuthContextValue | undefined>(
  undefined,
);
