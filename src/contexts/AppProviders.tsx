import type { ReactNode } from "react";
import { ActivityProvider } from "./ActivityContext";
import { CategoryProvider } from "./CategoryContext";
import { NotificationProvider } from "./NotificationContext";
import { ProductProvider } from "./ProductContext";
import { SupplierProvider } from "./SupplierContext";
import { TransactionProvider } from "./TransactionContext";
import { NetworkProvider } from "./NetworkContext";

type AppProvidersProps = {
  children: ReactNode;
};

export default function AppProviders({ children }: AppProvidersProps) {
  return (
    <NotificationProvider>
      <ActivityProvider>
        <ProductProvider>
          <CategoryProvider>
            <SupplierProvider>
              <TransactionProvider>
                <NetworkProvider>{children}</NetworkProvider>
              </TransactionProvider>
            </SupplierProvider>
          </CategoryProvider>
        </ProductProvider>
      </ActivityProvider>
    </NotificationProvider>
  );
}
