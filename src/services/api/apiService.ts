import type { AxiosRequestConfig } from "axios";
import axiosInstance from "./axiosInstance";
import type { ApiResponse } from "../../types/api";

export type { ApiResponse } from "../../types/api";

export const apiService = {
  get: async <TData>(url: string, config?: AxiosRequestConfig) => {
    const response = await axiosInstance.get<ApiResponse<TData>>(url, config);
    return response.data;
  },
  post: async <TData, TPayload = unknown>(
    url: string,
    payload?: TPayload,
    config?: AxiosRequestConfig,
  ) => {
    const response = await axiosInstance.post<ApiResponse<TData>>(
      url,
      payload,
      config,
    );
    return response.data;
  },
  put: async <TData, TPayload = unknown>(
    url: string,
    payload?: TPayload,
    config?: AxiosRequestConfig,
  ) => {
    const response = await axiosInstance.put<ApiResponse<TData>>(
      url,
      payload,
      config,
    );
    return response.data;
  },
  patch: async <TData, TPayload = unknown>(
    url: string,
    payload?: TPayload,
    config?: AxiosRequestConfig,
  ) => {
    const response = await axiosInstance.patch<ApiResponse<TData>>(
      url,
      payload,
      config,
    );
    return response.data;
  },
  delete: async <TData>(url: string, config?: AxiosRequestConfig) => {
    const response = await axiosInstance.delete<ApiResponse<TData>>(
      url,
      config,
    );
    return response.data;
  },
};
