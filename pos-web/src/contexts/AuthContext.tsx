import { useCallback, useMemo, useState } from "react";
import type { ReactNode } from "react";
import { STORAGE_KEYS } from "../constants/app";
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
    localStorage.removeItem(STORAGE_KEYS.authUser);
    return { user: null, token: null };
  }
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [{ user, token }, setAuthState] = useState(getInitialAuthState);

  const login = useCallback(({ token: nextToken, user: nextUser }: LoginPayload) => {
    localStorage.setItem(STORAGE_KEYS.authToken, nextToken);
    localStorage.setItem(STORAGE_KEYS.authUser, JSON.stringify(nextUser));
    setAuthState({ token: nextToken, user: nextUser });
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem(STORAGE_KEYS.authToken);
    localStorage.removeItem(STORAGE_KEYS.authUser);
    setAuthState({ token: null, user: null });
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      token,
      isAuthenticated: Boolean(token && user),
      isLoading: false,
      login,
      logout,
    }),
    [login, logout, token, user],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
