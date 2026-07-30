import { Suspense, lazy } from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";

import { ROUTES } from "../constants/routes";
import LoadingScreen from "../pages/system/LoadingScreen";
import ProtectedRoute from "./ProtectedRoute";

const AcceptOwnershipPage = lazy(
  () => import("../pages/accept-ownership/AcceptOwnershipPage"),
);
const LoginPage = lazy(() => import("../pages/login/LoginPage"));
const RegisterPage = lazy(() => import("../pages/register/RegisterPage"));
const DashboardPage = lazy(() => import("../pages/dashboard/DashboardPage"));
const ProductPage = lazy(() => import("../pages/product/ProductPage"));
const BarcodeLabelPage = lazy(
  () => import("../pages/barcode-label/BarcodeLabelPage"),
);
const CashierPage = lazy(() => import("../pages/cashier/CashierPage"));
const TransactionDetailPage = lazy(
  () => import("../pages/transactions/TransactionDetailPage"),
);
const TransactionsPage = lazy(() => import("../pages/transactions/TransactionsPage"));
const TransactionHistoryPage = lazy(
  () => import("../pages/transaction-history/TransactionHistoryPage"),
);
const CategoryPage = lazy(() => import("../pages/category/CategoryPage"));
const SupplierPage = lazy(() => import("../pages/supplier/SupplierPage"));
const RestockPage = lazy(() => import("../pages/restock/RestockPage"));
const StockHistoryPage = lazy(
  () => import("../pages/stock-history/StockHistoryPage"),
);
const ReportPage = lazy(() => import("../pages/report/ReportPage"));
const SettingPage = lazy(() => import("../pages/setting/SettingPage"));
const UserSettingsPage = lazy(
  () => import("../pages/user-settings/UserSettingsPage"),
);
const StoreManagementPage = lazy(
  () => import("../pages/store-management/StoreManagementPage"),
);
const RoleManagementPage = lazy(
  () => import("../pages/role-management/RoleManagementPage"),
);
const DeviceManagementPage = lazy(
  () => import("../pages/device-management/DeviceManagementPage"),
);
const HelpShortcutPage = lazy(() => import("../pages/help/HelpShortcutPage"));
const NotificationsPage = lazy(
  () => import("../pages/notifications/NotificationsPage"),
);
const NotFoundPage = lazy(() => import("../pages/system/NotFoundPage"));

export default function AppRoutes() {
  return (
    <BrowserRouter>
      <Suspense fallback={<LoadingScreen />}>
        <Routes>
          <Route path={ROUTES.login} element={<LoginPage />} />
          <Route path={ROUTES.register} element={<RegisterPage />} />
          <Route path={ROUTES.acceptOwnership} element={<AcceptOwnershipPage />} />

          <Route element={<ProtectedRoute />}>
            <Route path={ROUTES.dashboard} element={<DashboardPage />} />
            <Route path={ROUTES.product} element={<ProductPage />} />
            <Route path={ROUTES.barcodeLabels} element={<BarcodeLabelPage />} />
            <Route path={ROUTES.category} element={<CategoryPage />} />
            <Route path={ROUTES.supplier} element={<SupplierPage />} />
            <Route path={ROUTES.restock} element={<RestockPage />} />
            <Route path={ROUTES.stockHistory} element={<StockHistoryPage />} />
            <Route path={ROUTES.cashier} element={<CashierPage />} />
            <Route path={ROUTES.transactions} element={<TransactionsPage />} />
            <Route
              path={ROUTES.transactionDetail}
              element={<TransactionDetailPage />}
            />
            <Route
              path={ROUTES.transactionHistory}
              element={<TransactionHistoryPage />}
            />
            <Route path={ROUTES.report} element={<ReportPage />} />
            <Route path={ROUTES.setting} element={<SettingPage />} />
            <Route
              path={ROUTES.userSettings}
              element={<UserSettingsPage />}
            />
            <Route
              path={ROUTES.storeManagement}
              element={<StoreManagementPage />}
            />
            <Route
              path={ROUTES.roleManagement}
              element={<RoleManagementPage />}
            />
            <Route
              path={ROUTES.deviceManagement}
              element={<DeviceManagementPage />}
            />
            <Route path={ROUTES.helpShortcut} element={<HelpShortcutPage />} />
            <Route
              path={ROUTES.notifications}
              element={<NotificationsPage />}
            />
          </Route>

          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </Suspense>
    </BrowserRouter>
  );
}
