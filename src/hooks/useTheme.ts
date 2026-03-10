import { useCallback, useEffect, useState } from "react";
import { DEFAULT_THEME_ID, themes } from "../themes";
import type { Theme } from "../types";
import { loadGoogleFont } from "../utils/loadFont";
import atomOneDarkCss from "highlight.js/styles/atom-one-dark.css?raw";
import githubCss from "highlight.js/styles/github.css?raw";
import solarizedDarkCss from "highlight.js/styles/base16/solarized-dark.css?raw";

const STORAGE_KEY = "gulbahar-notes-theme";

const hljsCssMap: Record<string, string> = {
  "atom-one-dark": atomOneDarkCss,
  github: githubCss,
  "solarized-dark": solarizedDarkCss,
};

export function useTheme() {
  const [themeId, setThemeId] = useState<string>(() => {
    return (
      localStorage.getItem(STORAGE_KEY) ??
      localStorage.getItem("gulbahar-notes-theme") ??
      DEFAULT_THEME_ID
    );
  });

  const theme: Theme = themes.find((t) => t.id === themeId) ?? themes[1];

  useEffect(() => {
    const root = document.documentElement;
    for (const [key, value] of Object.entries(theme.vars)) {
      root.style.setProperty(key, value);
    }
    localStorage.setItem(STORAGE_KEY, themeId);

    if (theme.vars["--font-body"]) loadGoogleFont(theme.vars["--font-body"]);
    if (theme.vars["--font-heading"])
      loadGoogleFont(theme.vars["--font-heading"]);
    if (theme.vars["--font-code"]) loadGoogleFont(theme.vars["--font-code"]);

    let styleEl = document.getElementById("hljs-theme-style");
    if (!styleEl) {
      styleEl = document.createElement("style");
      styleEl.id = "hljs-theme-style";
      document.head.appendChild(styleEl);
    }
    styleEl.textContent = hljsCssMap[theme.hljsTheme] ?? "";
  }, [theme, themeId]);

  const setTheme = useCallback((id: string) => setThemeId(id), []);

  return { theme, themeId, setTheme, themes };
}
