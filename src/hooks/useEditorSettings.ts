import { useCallback, useState } from "react";

export interface EditorSettings {
  fontFamily: string;
  fontSize: number;
}

const FONT_FAMILY_KEY = "markpad_editor_font_family";
const FONT_SIZE_KEY = "markpad_editor_font_size";

export const FONT_OPTIONS = [
  { label: "JetBrains Mono", value: "'JetBrains Mono', monospace" },
  { label: "Fira Code", value: "'Fira Code', monospace" },
  { label: "Source Code Pro", value: "'Source Code Pro', monospace" },
  { label: "Cascadia Code", value: "'Cascadia Code', monospace" },
  { label: "System Monospace", value: "monospace" },
] as const;

export function useEditorSettings() {
  const [settings, setSettings] = useState<EditorSettings>(() => ({
    fontFamily:
      localStorage.getItem(FONT_FAMILY_KEY) ?? "'JetBrains Mono', monospace",
    fontSize: Number(localStorage.getItem(FONT_SIZE_KEY)) || 15,
  }));

  const updateFontFamily = useCallback((fontFamily: string) => {
    setSettings((s) => ({ ...s, fontFamily }));
    localStorage.setItem(FONT_FAMILY_KEY, fontFamily);
  }, []);

  const updateFontSize = useCallback((fontSize: number) => {
    setSettings((s) => ({ ...s, fontSize }));
    localStorage.setItem(FONT_SIZE_KEY, String(fontSize));
  }, []);

  return { settings, updateFontFamily, updateFontSize };
}
