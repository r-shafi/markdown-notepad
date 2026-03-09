export interface Theme {
  id: string;
  name: string;
  vars: Record<string, string>;
  hljsTheme: string;
}

export type PageSize = "a4" | "letter";

export interface ExportOptions {
  withTheme: boolean;
  pageSize: PageSize;
  fontSize: number;
}

export interface CommandItem {
  id: string;
  label: string;
  icon: string;
  shortcut?: string;
  group: "Document" | "Format" | "Theme" | "Export" | "View";
  action: () => void;
}

export interface CursorPosition {
  line: number;
  col: number;
}
