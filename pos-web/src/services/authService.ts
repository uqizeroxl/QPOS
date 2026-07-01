import { apiService } from "./api/apiService";
import type { AuthUser } from "../contexts/authContextValue";

export type LoginRequest = {
  username: string;
  password: string;
};

export type LoginResponse = {
  token: string;
  user: AuthUser;
};

export const authService = {
  login: (payload: LoginRequest) =>
    apiService.post<LoginResponse, LoginRequest>("/auth/login", payload),
  me: () => apiService.get<AuthUser>("/auth/me"),
  logout: () => apiService.post<null>("/auth/logout"),
};
