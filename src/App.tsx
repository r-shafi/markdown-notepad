import type { ReactCodeMirrorRef } from "@uiw/react-codemirror";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import CommandPalette from "./components/CommandPalette";
import Editor from "./components/Editor";
import ExportModal from "./components/ExportModal";
import Preview from "./components/Preview";
import Toast from "./components/Toast";
import Toolbar from "./components/Toolbar";
import { DEFAULT_DOCUMENT } from "./defaultDocument";
import { useCommandPalette } from "./hooks/useCommandPalette";
import { useKeyboardShortcuts } from "./hooks/useKeyboardShortcuts";
import { useTheme } from "./hooks/useTheme";
import { themes } from "./themes";
import type { CommandItem } from "./types";
import prettier from "prettier/standalone";
import parserMarkdown from "prettier/plugins/markdown";

const CONTENT_KEY = "markpad-content";
const SPLIT_KEY = "markpad-split";
const PREVIEW_KEY = "markpad-preview";

function getDocTitle(content: string) {
  const match = content.match(/^#\s+(.+)/m);
  return match ? match[1].trim() : "document";
}

export default function App() {
  const [content, setContent] = useState<string>(
    () => localStorage.getItem(CONTENT_KEY) ?? DEFAULT_DOCUMENT,
  );
  const [splitRatio, setSplitRatio] = useState<number>(() =>
    Number(localStorage.getItem(SPLIT_KEY) ?? 50),
  );
  const [showPreview, setShowPreview] = useState<boolean>(
    () => (localStorage.getItem(PREVIEW_KEY) ?? "true") === "true",
  );
  const [scrollRatio, setScrollRatio] = useState(0);
  const [toast, setToast] = useState<string | null>(null);
  const [mobileTab, setMobileTab] = useState<"edit" | "preview">("edit");
  const [exportOpen, setExportOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

  const editorRef = useRef<ReactCodeMirrorRef>(null);
  const dragging = useRef(false);
  const { theme, themeId, setTheme } = useTheme();
  const palette = useCommandPalette();

  // Persist content
  useEffect(() => {
    localStorage.setItem(CONTENT_KEY, content);
  }, [content]);

  // Persist split ratio
  useEffect(() => {
    localStorage.setItem(SPLIT_KEY, String(splitRatio));
  }, [splitRatio]);

  // Persist show preview
  useEffect(() => {
    localStorage.setItem(PREVIEW_KEY, String(showPreview));
  }, [showPreview]);

  // Resize observer
  useEffect(() => {
    const handler = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener("resize", handler);
    return () => window.removeEventListener("resize", handler);
  }, []);

  const showToast = useCallback((msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 2500);
  }, []);

  // Editor manipulation helpers
  const wrapSelection = useCallback((before: string, after = before) => {
    const view = editorRef.current?.view;
    if (!view) return;
    const { from, to } = view.state.selection.main;
    const selected = view.state.doc.sliceString(from, to);
    view.dispatch({
      changes: { from, to, insert: `${before}${selected}${after}` },
      selection: { anchor: from + before.length, head: to + before.length },
    });
  }, []);

  const insertAtCursor = useCallback((text: string) => {
    const view = editorRef.current?.view;
    if (!view) return;
    const { from } = view.state.selection.main;
    view.dispatch({ changes: { from, insert: text } });
  }, []);

  const duplicateLine = useCallback(() => {
    const view = editorRef.current?.view;
    if (!view) return;
    const { from } = view.state.selection.main;
    const line = view.state.doc.lineAt(from);
    view.dispatch({
      changes: { from: line.to, insert: `\n${line.text}` },
    });
  }, []);

  const toggleComment = useCallback(() => {
    wrapSelection("<!-- ", " -->");
  }, [wrapSelection]);

  const formatDoc = useCallback(async () => {
    try {
      const formatted = await prettier.format(content, {
        parser: "markdown",
        plugins: [parserMarkdown],
      });
      setContent(formatted);
      showToast("Document formatted ✓");
    } catch {
      showToast("Format failed");
    }
  }, [content, showToast]);

  // Resizable split pane
  const onDividerMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    dragging.current = true;
    const onMove = (ev: MouseEvent) => {
      if (!dragging.current) return;
      const container = document.getElementById("split-container");
      if (!container) return;
      const rect = container.getBoundingClientRect();
      const ratio = ((ev.clientX - rect.left) / rect.width) * 100;
      setSplitRatio(Math.min(80, Math.max(20, ratio)));
    };
    const onUp = () => {
      dragging.current = false;
    };
    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp, { once: true });
    return () => window.removeEventListener("mousemove", onMove);
  }, []);

  const isDark = !["minimal", "things"].includes(themeId);

  // Build command palette items
  const commands: CommandItem[] = useMemo(
    () => [
      {
        id: "bold",
        label: "Bold",
        icon: "B",
        shortcut: "Ctrl+B",
        group: "Format",
        action: () => wrapSelection("**"),
      },
      {
        id: "italic",
        label: "Italic",
        icon: "I",
        shortcut: "Ctrl+I",
        group: "Format",
        action: () => wrapSelection("_"),
      },
      {
        id: "link",
        label: "Insert Link",
        icon: "🔗",
        shortcut: "Ctrl+K",
        group: "Format",
        action: () => insertAtCursor("[text](url)"),
      },
      {
        id: "code-block",
        label: "Insert Code Block",
        icon: "<>",
        shortcut: "Ctrl+Shift+K",
        group: "Format",
        action: () => insertAtCursor("\n```\n\n```\n"),
      },
      {
        id: "format",
        label: "Format Document",
        icon: "✨",
        shortcut: "Ctrl+Shift+F",
        group: "Format",
        action: formatDoc,
      },
      {
        id: "comment",
        label: "Toggle Comment",
        icon: "//",
        shortcut: "Ctrl+/",
        group: "Format",
        action: toggleComment,
      },
      {
        id: "duplicate",
        label: "Duplicate Line",
        icon: "⊕",
        shortcut: "Ctrl+D",
        group: "Document",
        action: duplicateLine,
      },
      {
        id: "export",
        label: "Export PDF",
        icon: "⬇",
        shortcut: "Ctrl+E",
        group: "Export",
        action: () => setExportOpen(true),
      },
      {
        id: "toggle-preview",
        label: "Toggle Preview",
        icon: "👁",
        shortcut: "Ctrl+Shift+P",
        group: "View",
        action: () => setShowPreview((v) => !v),
      },
      ...themes.map((t, i) => ({
        id: `theme-${t.id}`,
        label: `Theme: ${t.name}`,
        icon: "🎨",
        shortcut: `Ctrl+${(i + 1) % 10}`,
        group: "Theme" as const,
        action: () => setTheme(t.id),
      })),
    ],
    [
      wrapSelection,
      insertAtCursor,
      formatDoc,
      toggleComment,
      duplicateLine,
      setTheme,
    ],
  );

  useKeyboardShortcuts({
    bold: () => wrapSelection("**"),
    italic: () => wrapSelection("_"),
    insertLink: () => insertAtCursor("[text](url)"),
    insertCodeBlock: () => insertAtCursor("\n```\n\n```\n"),
    formatDoc,
    openPalette: palette.toggle,
    exportPDF: () => setExportOpen(true),
    toggleComment,
    duplicateLine,
    togglePreview: () => setShowPreview((v) => !v),
    switchTheme: (i) => {
      if (themes[i]) setTheme(themes[i].id);
    },
  });

  return (
    <div className={`app-root ${isDark ? "dark" : "light"}`}>
      <Toolbar
        themes={themes}
        themeId={themeId}
        onThemeChange={setTheme}
        onOpenPalette={palette.toggle}
        onFormat={formatDoc}
        onExport={() => setExportOpen(true)}
        showPreview={showPreview}
        onTogglePreview={() => setShowPreview((v) => !v)}
        isMobile={isMobile}
      />

      {isMobile ? (
        <div className="mobile-layout">
          <div className="mobile-content">
            <AnimatedPane active={mobileTab === "edit"}>
              <Editor
                ref={editorRef}
                value={content}
                onChange={setContent}
                onScroll={(top, h, ch) =>
                  setScrollRatio(h > ch ? top / (h - ch) : 0)
                }
                darkMode={isDark}
              />
            </AnimatedPane>
            <AnimatedPane active={mobileTab === "preview"}>
              <Preview
                content={content}
                scrollRatio={scrollRatio}
                id="preview-pane"
              />
            </AnimatedPane>
          </div>
          <nav className="mobile-tabs">
            <button
              className={`tab-btn${mobileTab === "edit" ? " active" : ""}`}
              onClick={() => setMobileTab("edit")}
            >
              Edit
            </button>
            <button
              className={`tab-btn${mobileTab === "preview" ? " active" : ""}`}
              onClick={() => setMobileTab("preview")}
            >
              Preview
            </button>
          </nav>
        </div>
      ) : (
        <main id="split-container" className="split-container">
          <div className="pane editor-pane" style={{ width: `${splitRatio}%` }}>
            <Editor
              ref={editorRef}
              value={content}
              onChange={setContent}
              onScroll={(top, h, ch) =>
                setScrollRatio(h > ch ? top / (h - ch) : 0)
              }
              darkMode={isDark}
            />
          </div>
          <div
            className="divider"
            onMouseDown={onDividerMouseDown}
            title="Drag to resize"
          />
          {showPreview && (
            <div className="pane preview-container" style={{ flex: 1 }}>
              <Preview
                content={content}
                scrollRatio={scrollRatio}
                id="preview-pane"
              />
            </div>
          )}
        </main>
      )}

      <CommandPalette
        open={palette.open}
        onClose={palette.close}
        items={commands}
      />
      <ExportModal
        open={exportOpen}
        onClose={() => setExportOpen(false)}
        previewElId="preview-pane"
        documentTitle={getDocTitle(content)}
      />
      <Toast message={toast} />
    </div>
  );
}

function AnimatedPane({
  active,
  children,
}: {
  active: boolean;
  children: React.ReactNode;
}) {
  return (
    <div
      style={{
        position: "absolute",
        inset: 0,
        transition: "opacity 0.2s, transform 0.2s",
        opacity: active ? 1 : 0,
        pointerEvents: active ? "auto" : "none",
        transform: active ? "translateX(0)" : "translateX(10px)",
      }}
    >
      {children}
    </div>
  );
}
