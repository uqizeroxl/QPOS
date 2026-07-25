import { apiService } from "./api/apiService";
import type { AuthUser } from "../contexts/authContextValue";

export type LoginRequest = {
  username: string;
  password: string;
};

export type LoginResponse = {
  token: string;
  user: Omit<AuthUser, "role"> & {
    role: AuthUser["role"] | "OWNER" | "ADMIN" | "CASHIER" | "WAREHOUSE";
  };
};

export const authService = {
  login: (payload: LoginRequest) =>
    apiService.post<LoginResponse, LoginRequest>("/auth/login", payload),
  me: () => apiService.get<LoginResponse["user"]>("/auth/profile"),
  logout: () => apiService.post<null>("/auth/logout"),
};
