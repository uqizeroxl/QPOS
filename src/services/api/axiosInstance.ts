import axios from "axios";
import { API_BASE_URL, API_TIMEOUT } from "../../constants/api";
import { STORAGE_KEYS } from "../../constants/app";

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

axiosInstance.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error.response?.status;
    const message = error.response?.data?.message || error.message || "Terjadi kesalahan";

    if (status === 401 && window.location.pathname !== "/") {
      localStorage.removeItem(STORAGE_KEYS.authToken);
      localStorage.removeItem(STORAGE_KEYS.authUser);
      window.location.href = "/";
    }

    return Promise.reject(new Error(message));
  },
);

export default axiosInstance;
