import axios from "axios";
import { API_BASE_URL, API_TIMEOUT } from "../../constants/api";
import { STORAGE_KEYS } from "../../constants/app";
import { authService } from "../authService";

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

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
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
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (error.response?.status !== 401 || originalRequest._retry) {
      return Promise.reject(error);
    }

    const refreshToken = localStorage.getItem(STORAGE_KEYS.authRefreshToken);

    if (!refreshToken) {
      localStorage.removeItem(STORAGE_KEYS.authToken);
      localStorage.removeItem(STORAGE_KEYS.authRefreshToken);
      localStorage.removeItem(STORAGE_KEYS.authUser);
      return Promise.reject(error);
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
      localStorage.removeItem(STORAGE_KEYS.authToken);
      localStorage.removeItem(STORAGE_KEYS.authRefreshToken);
      localStorage.removeItem(STORAGE_KEYS.authUser);
      return Promise.reject(refreshError);
    } finally {
      isRefreshing = false;
    }
  },
);

export default axiosInstance;
