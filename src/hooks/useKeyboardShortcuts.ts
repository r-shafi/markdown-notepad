import { useEffect } from "react";

type Handler = () => void;

export interface ShortcutMap {
  bold: Handler;
  italic: Handler;
  insertLink: Handler;
  insertImage: Handler;
  insertCodeBlock: Handler;
  formatDoc: Handler;
  openPalette: Handler;
  exportPDF: Handler;
  saveDoc: Handler;
  toggleComment: Handler;
  duplicateLine: Handler;
  togglePreview: Handler;
  pasteAsPlainText: Handler;
  openSettings: Handler;
  switchTheme: (index: number) => void;
}

export function useKeyboardShortcuts(handlers: ShortcutMap) {
  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      const ctrl = e.ctrlKey || e.metaKey;
      if (!ctrl) return;

      const key = e.key.toLowerCase();

      if (key === "b" && !e.shiftKey && !e.altKey) {
        e.preventDefault();
        handlers.bold();
        return;
      }
      if (key === "i" && !e.shiftKey && !e.altKey) {
        e.preventDefault();
        handlers.italic();
        return;
      }
      if (key === "i" && e.shiftKey) {
        e.preventDefault();
        handlers.insertImage();
        return;
      }
      if (key === "k" && e.shiftKey) {
        e.preventDefault();
        handlers.insertCodeBlock();
        return;
      }
      if (key === "k" && !e.shiftKey) {
        e.preventDefault();
        handlers.insertLink();
        return;
      }
      if (key === "f" && e.shiftKey) {
        e.preventDefault();
        handlers.formatDoc();
        return;
      }
      if (key === "p" && !e.shiftKey) {
        e.preventDefault();
        handlers.openPalette();
        return;
      }
      if (key === "p" && e.shiftKey) {
        e.preventDefault();
        handlers.togglePreview();
        return;
      }
      if (key === "e" && !e.shiftKey) {
        e.preventDefault();
        handlers.exportPDF();
        return;
      }
      if (key === "s" && !e.shiftKey) {
        e.preventDefault();
        handlers.saveDoc();
        return;
      }
      if (key === "v" && e.shiftKey) {
        e.preventDefault();
        handlers.pasteAsPlainText();
        return;
      }
      if (key === "/" && !e.shiftKey) {
        e.preventDefault();
        handlers.toggleComment();
        return;
      }
      if (key === "d" && !e.shiftKey) {
        e.preventDefault();
        handlers.duplicateLine();
        return;
      }
      if (key === "," && !e.shiftKey) {
        e.preventDefault();
        handlers.openSettings();
        return;
      }

      const num = Number.parseInt(e.key, 10);
      if (!Number.isNaN(num)) {
        e.preventDefault();
        handlers.switchTheme(num === 0 ? 9 : num - 1);
      }
    }
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [handlers]);
}
