import { createContext } from "react";

export type ThemeMode = "light" | "dark";
export type ThemePreference = ThemeMode | "system";

export type ThemeContextValue = {
  theme: ThemePreference;
  resolvedTheme: ThemeMode;
  setTheme: (theme: ThemePreference) => void;
  toggleTheme: () => void;
};

export const ThemeContext = createContext<ThemeContextValue | undefined>(
  undefined,
);
