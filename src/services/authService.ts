import axios from "axios";
import { apiService } from "./api/apiService";
import { API_BASE_URL } from "../constants/api";
import { STORAGE_KEYS } from "../constants/app";
import type { AuthUser, AuthPayload, StoreInfo, OAuthLoginResponse } from "../types/auth";

export type { AuthUser, AuthPayload, StoreInfo, UserRole, OAuthLoginResponse } from "../types/auth";

export type AccountInfo = {
  id: string;
  username: string;
  name: string;
  email: string | null;
  googleId: string | null;
  tiktokId: string | null;
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
    const token = localStorage.getItem(STORAGE_KEYS.authToken);
    const refreshToken = localStorage.getItem(STORAGE_KEYS.authRefreshToken);

    try {
      await axios.post(
        `${API_BASE_URL}/auth/logout`,
        { refreshToken },
        {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
          timeout: 5000,
        },
      );
    } catch {
      // Ignore all errors — AuthContext will clean up credentials locally.
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
  acceptOwnership: async (token: string) => {
    try {
      await apiService.post("/auth/accept-ownership", { token });
    } catch (error) {
      return handleAuthError(error);
    }
  },
  getAccount: async () => {
    try {
      const response = await apiService.get<AccountInfo>("/auth/account");
      return response.data;
    } catch (error) {
      return handleAuthError(error);
    }
  },
  bindGoogle: async (accessToken: string) => {
    try {
      const response = await apiService.post<
        { email: string },
        { accessToken: string }
      >("/auth/bind-google", { accessToken });
      return response.data;
    } catch (error) {
      return handleAuthError(error);
    }
  },
  loginWithTikTok: async (authorizationCode: string) => {
    try {
      const response = await apiService.post<
        OAuthLoginResponse,
        { authorizationCode: string }
      >("/auth/tiktok", { authorizationCode });
      return response.data;
    } catch (error) {
      return handleAuthError(error);
    }
  },
  bindTikTok: async (authorizationCode: string) => {
    try {
      const response = await apiService.post<
        { name: string },
        { authorizationCode: string }
      >("/auth/bind-tiktok", { authorizationCode });
      return response.data;
    } catch (error) {
      return handleAuthError(error);
    }
  },
};
