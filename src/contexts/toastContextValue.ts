import { createContext } from "react";

export type ToastType = "success" | "error" | "info";

export type Toast = {
  id: string;
  message: string;
  type: ToastType;
};

export type ToastContextValue = {
  showToast: (message: string, type?: ToastType) => void;
};

export const ToastContext = createContext<ToastContextValue | undefined>(
  undefined,
);
