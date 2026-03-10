import {
  Bold,
  Clipboard,
  Code,
  Copy,
  Download,
  Eye,
  Image,
  Italic,
  Link,
  MessageSquare,
  Palette,
  Save,
  Sparkles,
} from "lucide-react";
import type { CommandItem, Theme } from "./types";

interface CommandDeps {
  wrapSelection: (before: string, after?: string) => void;
  insertLink: () => void;
  insertImage: () => void;
  insertCodeBlock: () => void;
  formatDoc: () => void;
  toggleComment: () => void;
  duplicateLine: () => void;
  saveAsMarkdown: () => void;
  pasteAsPlainText: () => void;
  openExport: () => void;
  togglePreview: () => void;
  setTheme: (id: string) => void;
  themes: Theme[];
}

export function createCommands(deps: CommandDeps): CommandItem[] {
  return [
    {
      id: "bold",
      label: "Bold",
      icon: <Bold size={14} />,
      shortcut: "Ctrl+B",
      group: "Format",
      action: () => deps.wrapSelection("**"),
    },
    {
      id: "italic",
      label: "Italic",
      icon: <Italic size={14} />,
      shortcut: "Ctrl+I",
      group: "Format",
      action: () => deps.wrapSelection("_"),
    },
    {
      id: "link",
      label: "Insert Link",
      icon: <Link size={14} />,
      shortcut: "Ctrl+K",
      group: "Format",
      action: deps.insertLink,
    },
    {
      id: "image",
      label: "Insert Image",
      icon: <Image size={14} />,
      shortcut: "Ctrl+Shift+I",
      group: "Format",
      action: deps.insertImage,
    },
    {
      id: "code-block",
      label: "Insert Code Block",
      icon: <Code size={14} />,
      shortcut: "Ctrl+Shift+K",
      group: "Format",
      action: deps.insertCodeBlock,
    },
    {
      id: "format",
      label: "Format Document",
      icon: <Sparkles size={14} />,
      shortcut: "Ctrl+Shift+F",
      group: "Format",
      action: deps.formatDoc,
    },
    {
      id: "comment",
      label: "Toggle Comment",
      icon: <MessageSquare size={14} />,
      shortcut: "Ctrl+/",
      group: "Format",
      action: deps.toggleComment,
    },
    {
      id: "duplicate",
      label: "Duplicate Line",
      icon: <Copy size={14} />,
      shortcut: "Ctrl+D",
      group: "Document",
      action: deps.duplicateLine,
    },
    {
      id: "save",
      label: "Save as Markdown",
      icon: <Save size={14} />,
      shortcut: "Ctrl+S",
      group: "Document",
      action: deps.saveAsMarkdown,
    },
    {
      id: "paste-plain",
      label: "Paste as Plain Text",
      icon: <Clipboard size={14} />,
      shortcut: "Ctrl+Shift+V",
      group: "Document",
      action: deps.pasteAsPlainText,
    },
    {
      id: "export",
      label: "Export PDF",
      icon: <Download size={14} />,
      shortcut: "Ctrl+E",
      group: "Export",
      action: deps.openExport,
    },
    {
      id: "toggle-preview",
      label: "Toggle Preview",
      icon: <Eye size={14} />,
      shortcut: "Ctrl+Shift+P",
      group: "View",
      action: deps.togglePreview,
    },
    ...deps.themes.map((t, i) => ({
      id: `theme-${t.id}`,
      label: `Theme: ${t.name}`,
      icon: <Palette size={14} />,
      shortcut: `Ctrl+${(i + 1) % 10}`,
      group: "Theme" as const,
      action: () => deps.setTheme(t.id),
    })),
  ];
}
