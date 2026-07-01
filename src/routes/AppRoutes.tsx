import { BrowserRouter, Routes, Route } from "react-router-dom";

import LoginPage from "../pages/login/LoginPage";
import DashboardPage from "../pages/dashboard/DashboardPage";
import ProductPage from "../pages/product/ProductPage";
import CashierPage from "../pages/cashier/CashierPage";
import TransactionHistoryPage from "../pages/transaction-history/TransactionHistoryPage";
import CategoryPage from "../pages/category/CategoryPage";
import SupplierPage from "../pages/supplier/SupplierPage";
import ReportPage from "../pages/report/ReportPage";
import SettingPage from "../pages/setting/SettingPage";
import HelpShortcutPage from "../pages/help/HelpShortcutPage";
import NotificationsPage from "../pages/notifications/NotificationsPage";
import NotFoundPage from "../pages/system/NotFoundPage";
import { ROUTES } from "../constants/routes";
import ProtectedRoute from "./ProtectedRoute";

export default function AppRoutes() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path={ROUTES.login} element={<LoginPage />} />

        <Route element={<ProtectedRoute />}>
          <Route path={ROUTES.dashboard} element={<DashboardPage />} />
          <Route path={ROUTES.product} element={<ProductPage />} />
          <Route path={ROUTES.category} element={<CategoryPage />} />
          <Route path={ROUTES.supplier} element={<SupplierPage />} />
          <Route path={ROUTES.cashier} element={<CashierPage />} />
          <Route
            path={ROUTES.transactionHistory}
            element={<TransactionHistoryPage />}
          />
          <Route path={ROUTES.report} element={<ReportPage />} />
          <Route path={ROUTES.setting} element={<SettingPage />} />
          <Route path={ROUTES.helpShortcut} element={<HelpShortcutPage />} />
          <Route
            path={ROUTES.notifications}
            element={<NotificationsPage />}
          />
        </Route>

        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </BrowserRouter>
  );
}
