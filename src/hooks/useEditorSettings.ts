import { useCallback, useState } from "react";
import { loadGoogleFont } from "../utils/loadFont";

export interface EditorSettings {
  fontFamily: string;
  fontSize: number;
}

const FONT_FAMILY_KEY = "gulbahar-notes-editor-font-family";
const FONT_SIZE_KEY = "gulbahar-notes-editor-font-size";

export const FONT_OPTIONS = [
  { label: "JetBrains Mono", value: "'JetBrains Mono', monospace" },
  { label: "Fira Code", value: "'Fira Code', monospace" },
  { label: "Source Code Pro", value: "'Source Code Pro', monospace" },
  { label: "Cascadia Code", value: "'Cascadia Code', monospace" },
  { label: "IBM Plex Mono", value: "'IBM Plex Mono', monospace" },
  { label: "Roboto Mono", value: "'Roboto Mono', monospace" },
  { label: "Ubuntu Mono", value: "'Ubuntu Mono', monospace" },
  { label: "Space Mono", value: "'Space Mono', monospace" },
  { label: "Inconsolata", value: "'Inconsolata', monospace" },
  { label: "Anonymous Pro", value: "'Anonymous Pro', monospace" },
  { label: "Cousine", value: "'Cousine', monospace" },
  { label: "PT Mono", value: "'PT Mono', monospace" },
  { label: "Noto Sans Mono", value: "'Noto Sans Mono', monospace" },
  { label: "Inter", value: "'Inter', sans-serif" },
  { label: "Roboto", value: "'Roboto', sans-serif" },
  { label: "Open Sans", value: "'Open Sans', sans-serif" },
  { label: "Lora", value: "'Lora', serif" },
  { label: "Merriweather", value: "'Merriweather', serif" },
  { label: "Nunito", value: "'Nunito', sans-serif" },
  { label: "Poppins", value: "'Poppins', sans-serif" },
  { label: "Lato", value: "'Lato', sans-serif" },
  { label: "Georgia", value: "'Georgia', serif" },
  { label: "System Monospace", value: "monospace" },
] as const;

export function useEditorSettings() {
  const [settings, setSettings] = useState<EditorSettings>(() => {
    const fontFamily =
      localStorage.getItem(FONT_FAMILY_KEY) ?? "'JetBrains Mono', monospace";
    const fontSize = Number(localStorage.getItem(FONT_SIZE_KEY)) || 15;
    loadGoogleFont(fontFamily);
    return { fontFamily, fontSize };
  });

  const updateFontFamily = useCallback((fontFamily: string) => {
    setSettings((s) => ({ ...s, fontFamily }));
    localStorage.setItem(FONT_FAMILY_KEY, fontFamily);
    loadGoogleFont(fontFamily);
  }, []);

  const updateFontSize = useCallback((fontSize: number) => {
    setSettings((s) => ({ ...s, fontSize }));
    localStorage.setItem(FONT_SIZE_KEY, String(fontSize));
  }, []);

  return { settings, updateFontFamily, updateFontSize };
}
