import type { AxiosResponse } from "axios";
import axios from "axios";
import { API_BASE_URL, API_TIMEOUT } from "../../constants/api";
import { STORAGE_KEYS } from "../../constants/app";
import type { ApiResponse, AuthPayload } from "../../types";
import { isTokenExpired } from "../../utils/token";
import { authService } from "../authService";
import { cacheService } from "../storage/cache.service";
import { db } from "../storage/db";
import { syncService } from "../storage/sync.service";

const CACHE_TTL = 5 * 60 * 1000;

const AUTH_PREFIXES = ["/auth/login", "/auth/refresh", "/auth/logout", "/auth/google", "/auth/apple", "/auth/tiktok", "/auth/bind-tiktok"];

function clearAuthAndRedirect(message?: string) {
  localStorage.removeItem(STORAGE_KEYS.authToken);
  localStorage.removeItem(STORAGE_KEYS.authRefreshToken);
  localStorage.removeItem(STORAGE_KEYS.authUser);
  window.dispatchEvent(new CustomEvent("auth:clear"));
  void Promise.allSettled([cacheService.clear(), db.pendingMutations.clear()]);

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

function buildMockResponse(url: string, method: string, body: Record<string, unknown> | undefined): Record<string, unknown> {
  const now = new Date().toISOString();
  const tempId = crypto.randomUUID();

  if (url.includes("/products") && !url.includes("/restocks") && !url.includes("/dataset") && !url.includes("/barcode")) {
    if (method === "POST") {
      return {
        id: tempId,
        barcode: body?.barcode ?? "",
        name: body?.name ?? "",
        categoryId: body?.categoryId ?? "",
        category: null,
        purchasePrice: body?.purchasePrice ?? null,
        sellingPrice: body?.sellingPrice ?? 0,
        stock: body?.stock ?? 0,
        minimumStock: body?.minimumStock,
        status: "ACTIVE",
      };
    }
    return { ...body, id: body?.id ?? tempId };
  }

  if (url.includes("/categories")) {
    if (method === "POST") {
      return {
        id: tempId,
        name: body?.name ?? "",
        description: body?.description ?? "",
        status: "ACTIVE",
        _count: { products: 0 },
        productCount: 0,
        createdAt: now,
        updatedAt: now,
      };
    }
    return { ...body, id: body?.id ?? tempId };
  }

  if (url.includes("/suppliers")) {
    if (method === "POST") {
      return {
        id: tempId,
        name: body?.name ?? "",
        phone: body?.phone ?? "",
        email: body?.email ?? "",
        address: body?.address ?? "",
        notes: body?.note ?? "",
        isActive: true,
        createdAt: now,
        updatedAt: now,
      };
    }
    return { ...body, id: body?.id ?? tempId };
  }

  return { id: tempId, ...body };
}

const axiosInstance = axios.create({
  baseURL: API_BASE_URL,
  timeout: API_TIMEOUT,
  headers: {
    "Content-Type": "application/json",
    Accept: "application/json",
  },
});

axiosInstance.interceptors.request.use(async (config) => {
  const token = localStorage.getItem(STORAGE_KEYS.authToken);

  if (token && !isTokenExpired(token)) {
    config.headers.Authorization = `Bearer ${token}`;
    return config;
  }

  if (token && isTokenExpired(token)) {
    const refreshToken = localStorage.getItem(STORAGE_KEYS.authRefreshToken);

    if (!refreshToken || isTokenExpired(refreshToken)) {
      clearAuthAndRedirect("Sesi Anda telah berakhir. Silakan login kembali.");
      return Promise.reject(new axios.Cancel("Sesi Anda telah berakhir. Silakan login ulang."));
    }

    if (isRefreshing) {
      await new Promise<void>((resolve, reject) => {
        failedQueue.push({ resolve: () => resolve(), reject });
      });
      const newToken = localStorage.getItem(STORAGE_KEYS.authToken);
      if (newToken) {
        config.headers.Authorization = `Bearer ${newToken}`;
      }
      return config;
    }

    isRefreshing = true;

    try {
      const data = await authService.refreshToken(refreshToken);
      localStorage.setItem(STORAGE_KEYS.authToken, data.token);
      localStorage.setItem(STORAGE_KEYS.authRefreshToken, data.refreshToken);
      localStorage.setItem(STORAGE_KEYS.authUser, JSON.stringify(data.user));
      config.headers.Authorization = `Bearer ${data.token}`;
    } catch {
      clearAuthAndRedirect("Sesi Anda telah berakhir. Silakan login kembali.");
      return Promise.reject(new axios.Cancel("Sesi Anda telah berakhir. Silakan login ulang."));
    } finally {
      processQueue(null);
      isRefreshing = false;
    }

    return config;
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
    const isPublicAuthRequest = AUTH_PREFIXES.some((prefix) => url.startsWith(prefix));

    if (error.response?.status === 401 && !isPublicAuthRequest && originalRequest && !originalRequest._retry) {
      originalRequest._retry = true;
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

        isRefreshing = true;

        try {
          const response = await axios.post<ApiResponse<AuthPayload>>(
            `${API_BASE_URL}/auth/refresh`,
            { refreshToken },
            { timeout: API_TIMEOUT, headers: { "Content-Type": "application/json" } },
          );
          const data = response.data.data;

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

    if (error.response?.status === 401 && originalRequest?._retry) {
      clearAuthAndRedirect("Sesi Anda telah berakhir. Silakan login kembali.");
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

      const body = originalRequest.data ? JSON.parse(originalRequest.data) : undefined;

      await syncService.enqueue(
        url,
        originalRequest.method as "POST" | "PUT" | "DELETE",
        body,
        headers,
      );

      const actionWord = originalRequest.method === "POST" ? "disimpan" : originalRequest.method === "PUT" || originalRequest.method === "PATCH" ? "diperbarui" : "dihapus";
      const message = `Data berhasil ${actionWord}, sinkronisasi akan dilakukan apabila terhubung ke server`;

      const mockData = buildMockResponse(url, originalRequest.method, body);
      const mockResponse: AxiosResponse = {
        data: { success: true, message, data: mockData },
        status: originalRequest.method === "POST" ? 201 : 200,
        statusText: "OK",
        headers: {},
        config: originalRequest,
      };

      window.dispatchEvent(new CustomEvent("app:toast", { detail: { message, type: "success" } }));

      return mockResponse;
    }

    return Promise.reject(error);
  },
);

export default axiosInstance;
