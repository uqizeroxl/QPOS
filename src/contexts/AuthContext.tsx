import { useCallback, useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";
import { STORAGE_KEYS } from "../constants/app";
import { authService } from "../services/authService";
import { cacheService } from "../services/storage/cache.service";
import { db } from "../services/storage/db";
import type { StoreInfo } from "../services/authService";
import { AuthContext } from "./authContextValue";
import type { AuthContextValue, AuthUser, LoginPayload } from "./authContextValue";

type AuthProviderProps = {
  children: ReactNode;
};

type AuthState = {
  user: AuthUser | null;
  token: string | null;
};

function getInitialAuthState(): AuthState {
  const storedToken = localStorage.getItem(STORAGE_KEYS.authToken);
  const storedUser = localStorage.getItem(STORAGE_KEYS.authUser);

  if (!storedToken || !storedUser) {
    return { user: null, token: null };
  }

  try {
    return {
      token: storedToken,
      user: JSON.parse(storedUser) as AuthUser,
    };
  } catch {
    localStorage.removeItem(STORAGE_KEYS.authToken);
    localStorage.removeItem(STORAGE_KEYS.authRefreshToken);
    localStorage.removeItem(STORAGE_KEYS.authUser);
    return { user: null, token: null };
  }
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [{ user, token }, setAuthState] = useState(getInitialAuthState);
  const [isLoading, setIsLoading] = useState(Boolean(token));
  const [stores, setStores] = useState<StoreInfo[]>([]);

  const fetchStores = useCallback(async () => {
    try {
      const data = await authService.listStores();
      setStores(data);
    } catch {
      setStores([]);
    }
  }, []);

  const login = useCallback(({ token: nextToken, refreshToken: nextRefreshToken, user: nextUser }: LoginPayload) => {
    localStorage.setItem(STORAGE_KEYS.authToken, nextToken);
    localStorage.setItem(STORAGE_KEYS.authRefreshToken, nextRefreshToken);
    localStorage.setItem(STORAGE_KEYS.authUser, JSON.stringify(nextUser));
    setAuthState({ token: nextToken, user: nextUser });
    setIsLoading(false);
    void fetchStores();
  }, [fetchStores]);

  const clearAuth = useCallback(() => {
    localStorage.removeItem(STORAGE_KEYS.authToken);
    localStorage.removeItem(STORAGE_KEYS.authRefreshToken);
    localStorage.removeItem(STORAGE_KEYS.authUser);
    setAuthState({ token: null, user: null });
    setIsLoading(false);
    setStores([]);
    sessionStorage.removeItem("product-page-size");
    void Promise.allSettled([cacheService.clear(), db.pendingMutations.clear()]);
  }, []);

  const logout = useCallback(async () => {
    try {
      await authService.logout();
    } finally {
      clearAuth();
      window.dispatchEvent(
        new CustomEvent("app:toast", {
          detail: { message: "Anda telah berhasil logout.", type: "success" },
        }),
      );
    }
  }, [clearAuth]);

  const switchStore = useCallback(async (storeId: string) => {
    const data = await authService.switchStore(storeId);
    localStorage.setItem(STORAGE_KEYS.authToken, data.token);
    localStorage.setItem(STORAGE_KEYS.authRefreshToken, data.refreshToken);
    localStorage.setItem(STORAGE_KEYS.authUser, JSON.stringify(data.user));
    setAuthState({ token: data.token, user: data.user });
    await fetchStores();
  }, [fetchStores]);

  useEffect(() => {
    if (!token) {
      setIsLoading(false);
      return;
    }

    let isMounted = true;

    const verifyProfile = async () => {
      try {
        const profile = await authService.profile();

        if (!isMounted) return;

        localStorage.setItem(STORAGE_KEYS.authUser, JSON.stringify(profile));
        setAuthState({ token, user: profile });
        await fetchStores();
      } catch {
        if (isMounted) {
          clearAuth();
          window.dispatchEvent(
            new CustomEvent("app:toast", {
              detail: {
                message: "Sesi Anda telah berakhir. Silakan login kembali.",
                type: "error",
              },
            }),
          );
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    void verifyProfile();

    return () => {
      isMounted = false;
    };
  }, [clearAuth, fetchStores, token]);

  useEffect(() => {
    const handleAuthClear = () => {
      clearAuth();
    };

    window.addEventListener("auth:clear", handleAuthClear);
    return () => window.removeEventListener("auth:clear", handleAuthClear);
  }, [clearAuth]);

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      token,
      stores,
      isAuthenticated: Boolean(token && user),
      isLoading,
      login,
      logout,
      switchStore,
    }),
    [isLoading, login, logout, switchStore, token, user, stores],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
