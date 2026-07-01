import type { ReactNode } from "react";
import { AuthProvider } from "./AuthContext";
import { ActivityProvider } from "./ActivityContext";
import { CategoryProvider } from "./CategoryContext";
import { NotificationProvider } from "./NotificationContext";
import { ProductProvider } from "./ProductContext";
import { SupplierProvider } from "./SupplierContext";
import { SettingsProvider } from "./SettingsContext";
import { ThemeProvider } from "./ThemeContext";
import { ToastProvider } from "./ToastContext";
import { TransactionProvider } from "./TransactionContext";

type AppProvidersProps = {
  children: ReactNode;
};

export default function AppProviders({ children }: AppProvidersProps) {
  return (
    <ThemeProvider>
      <SettingsProvider>
        <ToastProvider>
          <NotificationProvider>
            <ActivityProvider>
              <ProductProvider>
                <CategoryProvider>
                  <SupplierProvider>
                    <TransactionProvider>
                      <AuthProvider>{children}</AuthProvider>
                    </TransactionProvider>
                  </SupplierProvider>
                </CategoryProvider>
              </ProductProvider>
            </ActivityProvider>
          </NotificationProvider>
        </ToastProvider>
      </SettingsProvider>
    </ThemeProvider>
  );
}
