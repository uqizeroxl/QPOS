import { useEffect, useRef } from "react";
import { Navigate, Outlet, useLocation } from "react-router-dom";
import { ROUTES } from "../constants/routes";
import { useAuth } from "../hooks/useAuth";
import { useToast } from "../hooks/useToast";

export default function ProtectedRoute() {
  const { isAuthenticated, isLoading } = useAuth();
  const location = useLocation();
  const { showToast } = useToast();
  const toastShown = useRef(false);

  useEffect(() => {
    if (isLoading && !toastShown.current) {
      toastShown.current = true;
      showToast("Sedang memverifikasi sesi...", "info");
    }
  }, [isLoading, showToast]);

  if (isLoading) {
    return <Outlet />;
  }

  if (!isAuthenticated) {
    return <Navigate to={ROUTES.login} replace state={{ from: location }} />;
  }

  return <Outlet />;
}
