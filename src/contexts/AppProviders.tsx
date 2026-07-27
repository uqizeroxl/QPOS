import type { ReactNode } from "react";
import { GoogleOAuthProvider } from "@react-oauth/google";
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

const GOOGLE_CLIENT_ID =
  import.meta.env.VITE_GOOGLE_CLIENT_ID ?? "";

export default function AppProviders({ children }: AppProvidersProps) {
  return (
    <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID}>
      <ThemeProvider>
        <AuthProvider>
          <SettingsProvider>
            <ToastProvider>
              <NotificationProvider>
                <ActivityProvider>
                  <ProductProvider>
                    <CategoryProvider>
                      <SupplierProvider>
                        <TransactionProvider>{children}</TransactionProvider>
                      </SupplierProvider>
                    </CategoryProvider>
                  </ProductProvider>
                </ActivityProvider>
              </NotificationProvider>
            </ToastProvider>
          </SettingsProvider>
        </AuthProvider>
      </ThemeProvider>
    </GoogleOAuthProvider>
  );
}
