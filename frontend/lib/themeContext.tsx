"use client";

import { createContext, useContext, useEffect, useMemo, useState } from "react";

type ThemeMode = "light" | "dark" | "high-contrast";

type ThemeContextValue = {
  mode: ThemeMode;
  setMode: (mode: ThemeMode) => void;
  cycleMode: () => void;
};

const ThemeContext = createContext<ThemeContextValue>({
  mode: "light",
  setMode: () => undefined,
  cycleMode: () => undefined,
});

function readStoredMode(): ThemeMode {
  if (typeof window === "undefined") return "light";
  const stored = window.localStorage.getItem("bhrigu.theme") as ThemeMode | null;
  if (stored && ["light", "dark", "high-contrast"].includes(stored)) return stored;
  const prefersDark = window.matchMedia?.("(prefers-color-scheme: dark)").matches;
  return prefersDark ? "dark" : "light";
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [mode, setMode] = useState<ThemeMode>(() => readStoredMode());

  useEffect(() => {
    if (typeof document === "undefined") return;
    document.body.dataset.theme = mode;
    document.documentElement.dataset.theme = mode;
    document.documentElement.style.colorScheme = mode === "light" ? "light" : "dark";
    window?.localStorage?.setItem("bhrigu.theme", mode);
  }, [mode]);

  const cycleMode = () => {
    setMode((prev) => {
      if (prev === "light") return "dark";
      if (prev === "dark") return "high-contrast";
      return "light";
    });
  };

  const value = useMemo(() => ({ mode, setMode, cycleMode }), [mode]);

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useThemeMode() {
  return useContext(ThemeContext);
}

export type { ThemeMode };
