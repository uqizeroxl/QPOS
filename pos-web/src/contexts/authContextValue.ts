import { createContext } from "react";
import type { AuthUser } from "../services/authService";
export type { AuthUser } from "../services/authService";

export type LoginPayload = {
  token: string;
  user: AuthUser;
};

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
