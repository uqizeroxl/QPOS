import axios from "axios";
import { apiService } from "./api/apiService";
import type { AuthUser, AuthPayload, StoreInfo, OAuthLoginResponse } from "../types/auth";

export type { AuthUser, AuthPayload, StoreInfo, UserRole, OAuthLoginResponse } from "../types/auth";

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
  refreshToken: async (refreshTokenValue: string) => {
    try {
      const response = await apiService.post<
        AuthPayload,
        { refreshToken: string }
      >("/auth/refresh", { refreshToken: refreshTokenValue });

      return response.data;
    } catch (error) {
      return handleAuthError(error);
    }
  },
  listStores: async () => {
    try {
      const response = await apiService.get<StoreInfo[]>("/auth/stores");
      return response.data;
    } catch (error) {
      return handleAuthError(error);
    }
  },
  switchStore: async (storeId: string) => {
    try {
      const response = await apiService.post<
        AuthPayload,
        { storeId: string }
      >("/auth/switch-store", { storeId });
      return response.data;
    } catch (error) {
      return handleAuthError(error);
    }
  },
  loginWithGoogle: async (accessToken: string) => {
    try {
      const response = await apiService.post<
        OAuthLoginResponse,
        { accessToken: string }
      >("/auth/google", { accessToken });
      return response.data;
    } catch (error) {
      return handleAuthError(error);
    }
  },
  loginWithApple: async (authorizationCode: string) => {
    try {
      const response = await apiService.post<
        OAuthLoginResponse,
        { authorizationCode: string }
      >("/auth/apple", { authorizationCode });
      return response.data;
    } catch (error) {
      return handleAuthError(error);
    }
  },
  completeRegistration: async (registrationToken: string, storeName: string) => {
    try {
      const response = await apiService.post<
        AuthPayload,
        { registrationToken: string; storeName: string }
      >("/auth/complete-registration", { registrationToken, storeName });
      return response.data;
    } catch (error) {
      return handleAuthError(error);
    }
  },
};
