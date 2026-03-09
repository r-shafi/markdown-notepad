import { useCallback, useEffect, useState } from "react";
import { DEFAULT_THEME_ID, themes } from "../themes";
import type { Theme } from "../types";

const STORAGE_KEY = "markpad-theme";

export function useTheme() {
  const [themeId, setThemeId] = useState<string>(() => {
    return localStorage.getItem(STORAGE_KEY) ?? DEFAULT_THEME_ID;
  });

  const theme: Theme = themes.find((t) => t.id === themeId) ?? themes[1];

  useEffect(() => {
    const root = document.documentElement;
    for (const [key, value] of Object.entries(theme.vars)) {
      root.style.setProperty(key, value);
    }
    localStorage.setItem(STORAGE_KEY, themeId);
  }, [theme, themeId]);

  const setTheme = useCallback((id: string) => setThemeId(id), []);

  return { theme, themeId, setTheme, themes };
}
