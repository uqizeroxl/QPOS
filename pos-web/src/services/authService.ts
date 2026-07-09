import axios from "axios";
import { apiService } from "./api/apiService";

export type UserRole = "OWNER" | "ADMIN" | "CASHIER" | "WAREHOUSE";

export type AuthUser = {
  id: string;
  username: string;
  name: string;
  role: UserRole;
};

export type AuthPayload = {
  token: string;
  user: AuthUser;
};

export class AuthApiError extends Error {
  constructor(message: string) {
    super(message);
  }
}

const handleAuthError = (error: unknown): never => {
  if (axios.isAxiosError<{ message?: string }>(error)) {
    if (!error.response) {
      throw new AuthApiError("Backend tidak dapat diakses.");
    }

    throw new AuthApiError(
      error.response.data?.message ?? "Terjadi kesalahan pada server.",
    );
  }

  throw error;
};

export const authService = {
  login: async (username: string, password: string) => {
    try {
      const response = await apiService.post<
        AuthPayload,
        { username: string; password: string }
      >("/auth/login", { username, password });

      return response.data;
    } catch (error) {
      return handleAuthError(error);
    }
  },
  profile: async () => {
    try {
      const response = await apiService.get<AuthUser>("/auth/profile");

      return response.data;
    } catch (error) {
      return handleAuthError(error);
    }
  },
  logout: async () => {
    try {
      await apiService.post("/auth/logout");
    } catch (error) {
      return handleAuthError(error);
    }
  },
};
