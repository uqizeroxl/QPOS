import { useCallback, useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";
import { STORAGE_KEYS } from "../constants/app";
import { authService } from "../services/authService";
import { AuthContext } from "./authContextValue";
import type { AuthContextValue, AuthUser } from "./authContextValue";

type AuthProviderProps = {
  children: ReactNode;
};

function getStoredToken(): string | null {
  return localStorage.getItem(STORAGE_KEYS.authToken);
}

function getStoredUser(): AuthUser | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.authUser);
    return raw ? (JSON.parse(raw) as AuthUser) : null;
  } catch {
    return null;
  }
}

function clearAuthStorage() {
  localStorage.removeItem(STORAGE_KEYS.authToken);
  localStorage.removeItem(STORAGE_KEYS.authUser);
}

function saveAuthStorage(token: string, user: AuthUser) {
  localStorage.setItem(STORAGE_KEYS.authToken, token);
  localStorage.setItem(STORAGE_KEYS.authUser, JSON.stringify(user));
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<AuthUser | null>(getStoredUser);
  const [token, setToken] = useState<string | null>(getStoredToken);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const storedToken = getStoredToken();

    if (!storedToken) {
      return;
    }

    void authService
      .me()
      .then((response) => {
        const me = response.data;
        const authUser: AuthUser = {
          id: me.id,
          name: me.name,
          role: me.role,
        };
        setToken(storedToken);
        setUser(authUser);
        saveAuthStorage(storedToken, authUser);
      })
      .catch(() => {
        clearAuthStorage();
        setToken(null);
        setUser(null);
      })
      .finally(() => {
        setIsLoading(false);
      });
  }, []);

  const login = useCallback(async (username: string, password: string) => {
    try {
      const response = await authService.login({ username, password });
      const { token: apiToken, user: apiUser } = response.data;
      const authUser: AuthUser = {
        id: apiUser.id,
        name: apiUser.name,
        role: apiUser.role,
      };
      saveAuthStorage(apiToken, authUser);
      setToken(apiToken);
      setUser(authUser);
      return { ok: true as const };
    } catch (error: unknown) {
      const message =
        error instanceof Error ? error.message : "Login gagal";
      return { ok: false as const, error: message };
    }
  }, []);

  const logout = useCallback(async () => {
    try {
      await authService.logout();
    } catch {
      // ignore logout errors
    }
    clearAuthStorage();
    setToken(null);
    setUser(null);
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      token,
      isAuthenticated: Boolean(token && user),
      isLoading,
      login,
      logout,
    }),
    [login, logout, token, user, isLoading],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
