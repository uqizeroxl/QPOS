import axios from "axios";
import { API_BASE_URL, API_TIMEOUT } from "../../constants/api";
import { STORAGE_KEYS } from "../../constants/app";
import { isTokenExpired } from "../../utils/token";
import { authService } from "../authService";
import { cacheService } from "../storage/cache.service";
import { syncService } from "../storage/sync.service";

const CACHE_TTL = 5 * 60 * 1000;

const AUTH_PREFIXES = ["/auth/login", "/auth/refresh", "/auth/google", "/auth/apple", "/auth/tiktok", "/auth/bind-tiktok"];

function clearAuthAndRedirect(message?: string) {
  localStorage.removeItem(STORAGE_KEYS.authToken);
  localStorage.removeItem(STORAGE_KEYS.authRefreshToken);
  localStorage.removeItem(STORAGE_KEYS.authUser);
  window.dispatchEvent(new CustomEvent("auth:clear"));

  if (message) {
    sessionStorage.setItem("auth_expired_message", message);
  }

  if (window.location.pathname !== "/") {
    window.location.href = "/";
  }
}

function shouldCache(url: string): boolean {
  return !AUTH_PREFIXES.some((prefix) => url.startsWith(prefix));
}

function shouldEnqueueOnOffline(method: string | undefined, url: string): boolean {
  if (method === "GET") return false;
  if (method === "POST" && url.endsWith("/logout")) return false;
  return !AUTH_PREFIXES.some((prefix) => url.startsWith(prefix));
}

function stripOrigin(fullUrl: string): string {
  try {
    const u = new URL(fullUrl);
    return u.pathname + u.search;
  } catch {
    return fullUrl;
  }
}

const axiosInstance = axios.create({
  baseURL: API_BASE_URL,
  timeout: API_TIMEOUT,
  headers: {
    "Content-Type": "application/json",
    Accept: "application/json",
  },
});

axiosInstance.interceptors.request.use((config) => {
  const token = localStorage.getItem(STORAGE_KEYS.authToken);

  if (token && !isTokenExpired(token)) {
    config.headers.Authorization = `Bearer ${token}`;
    return config;
  }

  if (token && isTokenExpired(token)) {
    const refreshToken = localStorage.getItem(STORAGE_KEYS.authRefreshToken);

    if (refreshToken && isTokenExpired(refreshToken)) {
          clearAuthAndRedirect("Sesi Anda telah berakhir. Silakan login kembali.");
          return Promise.reject(new axios.Cancel("Sesi telah berakhir. Silakan login ulang."));
    }
  }

  return config;
});

let isRefreshing = false;
let failedQueue: Array<{
  resolve: (value: unknown) => void;
  reject: (reason: unknown) => void;
}> = [];

function processQueue(error: unknown) {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(undefined);
    }
  });
  failedQueue = [];
}

axiosInstance.interceptors.response.use(
  async (response) => {
    if (response.config.method === "get" && shouldCache(response.config.url ?? "")) {
      const cacheKey = stripOrigin(response.config.url ?? "");
      await cacheService.set(cacheKey, response.data, CACHE_TTL);
    }
    return response;
  },
  async (error) => {
    const originalRequest = error.config;
    const isNetworkError = !error.response;
    const method = originalRequest?.method?.toLowerCase();
    const url = stripOrigin(originalRequest?.url ?? "");

    if (error.response?.status === 401 && !originalRequest._retry) {
      const refreshToken = localStorage.getItem(STORAGE_KEYS.authRefreshToken);

      if (refreshToken) {
        if (isTokenExpired(refreshToken)) {
          clearAuthAndRedirect();
          return Promise.reject(new axios.Cancel("Sesi telah berakhir. Silakan login ulang."));
        }

        if (isRefreshing) {
          return new Promise((resolve, reject) => {
            failedQueue.push({ resolve, reject });
          }).then(() => {
            originalRequest.headers.Authorization = `Bearer ${localStorage.getItem(STORAGE_KEYS.authToken)}`;
            return axiosInstance(originalRequest);
          });
        }

        originalRequest._retry = true;
        isRefreshing = true;

        try {
          const data = await authService.refreshToken(refreshToken);

          localStorage.setItem(STORAGE_KEYS.authToken, data.token);
          localStorage.setItem(STORAGE_KEYS.authRefreshToken, data.refreshToken);
          localStorage.setItem(STORAGE_KEYS.authUser, JSON.stringify(data.user));

          processQueue(null);
          originalRequest.headers.Authorization = `Bearer ${data.token}`;
          return axiosInstance(originalRequest);
        } catch (refreshError) {
          processQueue(refreshError);
          clearAuthAndRedirect("Sesi Anda telah berakhir. Silakan login kembali.");
          return Promise.reject(refreshError);
        } finally {
          isRefreshing = false;
        }
      }

      clearAuthAndRedirect("Sesi Anda telah berakhir. Silakan login kembali.");
      return Promise.reject(error);
    }

    if (isNetworkError && method === "get" && shouldCache(url)) {
      const cached = await cacheService.get<unknown>(url);
      if (cached !== null) {
        return { data: cached };
      }
    }

    if (isNetworkError && shouldEnqueueOnOffline(originalRequest?.method, url)) {
      const token = localStorage.getItem(STORAGE_KEYS.authToken);
      const headers: Record<string, string> = {};
      if (token) {
        headers.Authorization = `Bearer ${token}`;
      }

      await syncService.enqueue(
        url,
        originalRequest.method as "POST" | "PUT" | "DELETE",
        originalRequest.data ? JSON.parse(originalRequest.data) : undefined,
        headers,
      );

      return Promise.reject(new Error("Anda sedang offline. Transaksi akan diproses saat koneksi tersedia."));
    }

    return Promise.reject(error);
  },
);

export default axiosInstance;
