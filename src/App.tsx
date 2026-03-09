import type { ReactCodeMirrorRef } from "@uiw/react-codemirror";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import CommandPalette from "./components/CommandPalette";
import Editor from "./components/Editor";
import ExportModal from "./components/ExportModal";
import Preview from "./components/Preview";
import SettingsPanel from "./components/SettingsPanel";
import StatusBar from "./components/StatusBar";
import Toast from "./components/Toast";
import Toolbar from "./components/Toolbar";
import { Eye, PenLine } from "lucide-react";
import { DEFAULT_DOCUMENT } from "./defaultDocument";
import { useCommandPalette } from "./hooks/useCommandPalette";
import { useEditorSettings } from "./hooks/useEditorSettings";
import { useKeyboardShortcuts } from "./hooks/useKeyboardShortcuts";
import { useTheme } from "./hooks/useTheme";
import { themes } from "./themes";
import type { CommandItem, CursorPosition } from "./types";
import prettier from "prettier/standalone";
import parserMarkdown from "prettier/plugins/markdown";

const CONTENT_KEY = "markpad_content";
const SPLIT_KEY = "markpad_split_ratio";

function getDocTitle(content: string) {
  const match = content.match(/^#\s+(.+)/m);
  return match ? match[1].trim() : "document";
}

function countWords(text: string) {
  return text.trim() ? text.trim().split(/\s+/).length : 0;
}

export default function App() {
  const [content, setContent] = useState<string>(
    () =>
      localStorage.getItem(CONTENT_KEY) ??
      localStorage.getItem("markpad-content") ??
      DEFAULT_DOCUMENT,
  );
  const [splitRatio, setSplitRatio] = useState<number>(() =>
    Number(
      localStorage.getItem(SPLIT_KEY) ??
        localStorage.getItem("markpad-split") ??
        50,
    ),
  );
  const [showPreview, setShowPreview] = useState(true);
  const [scrollRatio, setScrollRatio] = useState(0);
  const [toast, setToast] = useState<string | null>(null);
  const [mobileTab, setMobileTab] = useState<"edit" | "preview">("edit");
  const [exportOpen, setExportOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  const [cursor, setCursor] = useState<CursorPosition>({ line: 1, col: 1 });

  const editorRef = useRef<ReactCodeMirrorRef>(null);
  const dragging = useRef(false);
  const touchStartX = useRef<number>(0);
  const { theme, themeId, setTheme } = useTheme();
  const palette = useCommandPalette();
  const { settings, updateFontFamily, updateFontSize } = useEditorSettings();

  // Persist content
  useEffect(() => {
    localStorage.setItem(CONTENT_KEY, content);
  }, [content]);

  // Persist split ratio
  useEffect(() => {
    localStorage.setItem(SPLIT_KEY, String(splitRatio));
  }, [splitRatio]);

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

  const insertLink = useCallback(() => {
    const view = editorRef.current?.view;
    if (!view) return;
    const { from, to } = view.state.selection.main;
    const selected = view.state.doc.sliceString(from, to);
    if (selected) {
      // Wrap selection: [selected](url)
      const replacement = `[${selected}](url)`;
      view.dispatch({
        changes: { from, to, insert: replacement },
        selection: {
          anchor: from + selected.length + 3,
          head: from + selected.length + 6,
        },
      });
    } else {
      // Insert [](url) with cursor between brackets
      view.dispatch({
        changes: { from, insert: "[](url)" },
        selection: { anchor: from + 1 },
      });
    }
  }, []);

  const insertCodeBlock = useCallback(() => {
    const view = editorRef.current?.view;
    if (!view) return;
    const { from, to } = view.state.selection.main;
    const selected = view.state.doc.sliceString(from, to);
    if (selected) {
      const replacement = `\n\`\`\`\n${selected}\n\`\`\`\n`;
      view.dispatch({
        changes: { from, to, insert: replacement },
        selection: { anchor: from + 4 },
      });
    } else {
      view.dispatch({
        changes: { from, insert: "\n```\n\n```\n" },
        selection: { anchor: from + 5 },
      });
    }
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
    const view = editorRef.current?.view;
    if (!view) return;
    const { from, to } = view.state.selection.main;

    if (from === to) {
      // No selection: toggle comment on current line
      const line = view.state.doc.lineAt(from);
      const text = line.text;
      if (
        text.trimStart().startsWith("<!--") &&
        text.trimEnd().endsWith("-->")
      ) {
        const newText = text
          .replace(/^\s*<!--\s?/, "")
          .replace(/\s?-->\s*$/, "");
        view.dispatch({
          changes: { from: line.from, to: line.to, insert: newText },
        });
      } else {
        view.dispatch({
          changes: {
            from: line.from,
            to: line.to,
            insert: `<!-- ${text} -->`,
          },
        });
      }
    } else {
      const selected = view.state.doc.sliceString(from, to);
      if (selected.startsWith("<!--") && selected.endsWith("-->")) {
        const unwrapped = selected.slice(4, -3).trim();
        view.dispatch({
          changes: { from, to, insert: unwrapped },
        });
      } else {
        view.dispatch({
          changes: { from, to, insert: `<!-- ${selected} -->` },
          selection: { anchor: from + 5, head: to + 5 },
        });
      }
    }
  }, []);

  const formatDoc = useCallback(async () => {
    const view = editorRef.current?.view;
    try {
      const text = view ? view.state.doc.toString() : content;
      const cursorLine = view
        ? view.state.doc.lineAt(view.state.selection.main.head).number
        : 1;
      const formatted = await prettier.format(text, {
        parser: "markdown",
        plugins: [parserMarkdown],
      });
      if (view) {
        view.dispatch({
          changes: { from: 0, to: view.state.doc.length, insert: formatted },
        });
        // Restore cursor to same line (clamped)
        const targetLine = Math.min(cursorLine, view.state.doc.lines);
        const lineInfo = view.state.doc.line(targetLine);
        view.dispatch({
          selection: { anchor: lineInfo.from },
        });
      } else {
        setContent(formatted);
      }
      showToast("Document formatted ✓");
    } catch {
      showToast("Format failed");
    }
  }, [content, showToast]);

  const saveAsMarkdown = useCallback(() => {
    const title = getDocTitle(content);
    const blob = new Blob([content], { type: "text/markdown" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${title.replace(/[^a-z0-9_\-]/gi, "_")}.md`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    showToast("Document saved ✓");
  }, [content, showToast]);

  const pasteAsPlainText = useCallback(async () => {
    const view = editorRef.current?.view;
    if (!view) return;
    try {
      const text = await navigator.clipboard.readText();
      if (!text) return;
      const { from, to } = view.state.selection.main;
      view.dispatch({
        changes: { from, to, insert: text },
        selection: { anchor: from + text.length },
      });
    } catch {
      // clipboard access denied
    }
  }, []);

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
        action: insertLink,
      },
      {
        id: "code-block",
        label: "Insert Code Block",
        icon: "<>",
        shortcut: "Ctrl+Shift+K",
        group: "Format",
        action: insertCodeBlock,
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
        id: "save",
        label: "Save as Markdown",
        icon: "💾",
        shortcut: "Ctrl+S",
        group: "Document",
        action: saveAsMarkdown,
      },
      {
        id: "paste-plain",
        label: "Paste as Plain Text",
        icon: "📋",
        shortcut: "Ctrl+Shift+V",
        group: "Document",
        action: pasteAsPlainText,
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
      insertLink,
      insertCodeBlock,
      formatDoc,
      toggleComment,
      duplicateLine,
      saveAsMarkdown,
      pasteAsPlainText,
      setTheme,
    ],
  );

  useKeyboardShortcuts({
    bold: () => wrapSelection("**"),
    italic: () => wrapSelection("_"),
    insertLink,
    insertCodeBlock,
    formatDoc,
    openPalette: palette.toggle,
    exportPDF: () => setExportOpen(true),
    saveDoc: saveAsMarkdown,
    toggleComment,
    duplicateLine,
    togglePreview: () => setShowPreview((v) => !v),
    pasteAsPlainText,
    switchTheme: (i) => {
      if (themes[i]) setTheme(themes[i].id);
    },
  });

  const onCursorChange = useCallback((pos: CursorPosition) => {
    setCursor(pos);
  }, []);

  const insertHeading = useCallback((level: number) => {
    const view = editorRef.current?.view;
    if (!view) return;
    const { from } = view.state.selection.main;
    const line = view.state.doc.lineAt(from);
    const prefix = "#".repeat(level) + " ";
    const text = line.text.replace(/^#{1,6}\s/, "");
    view.dispatch({
      changes: { from: line.from, to: line.to, insert: prefix + text },
      selection: { anchor: line.from + prefix.length },
    });
  }, []);

  const insertPrefix = useCallback((prefix: string) => {
    const view = editorRef.current?.view;
    if (!view) return;
    const { from } = view.state.selection.main;
    const line = view.state.doc.lineAt(from);
    if (line.text.startsWith(prefix)) {
      view.dispatch({
        changes: { from: line.from, to: line.from + prefix.length, insert: "" },
      });
    } else {
      view.dispatch({
        changes: { from: line.from, insert: prefix },
        selection: { anchor: from + prefix.length },
      });
    }
  }, []);

  return (
    <div className={`app-root ${isDark ? "dark" : "light"}`}>
      <Toolbar
        themes={themes}
        themeId={themeId}
        onThemeChange={setTheme}
        onOpenPalette={palette.toggle}
        onFormat={formatDoc}
        onExport={() => setExportOpen(true)}
        onToggleSettings={() => setSettingsOpen((v) => !v)}
        showPreview={showPreview}
        onTogglePreview={() => setShowPreview((v) => !v)}
        isMobile={isMobile}
      />
      <SettingsPanel
        open={settingsOpen}
        onClose={() => setSettingsOpen(false)}
        fontFamily={settings.fontFamily}
        fontSize={settings.fontSize}
        onFontFamilyChange={updateFontFamily}
        onFontSizeChange={updateFontSize}
        themes={themes}
        themeId={themeId}
        onThemeChange={setTheme}
      />

      {isMobile ? (
        <div className="mobile-layout">
          <div
            className="mobile-content"
            onTouchStart={(e) => {
              touchStartX.current = e.touches[0].clientX;
            }}
            onTouchEnd={(e) => {
              const dx = e.changedTouches[0].clientX - touchStartX.current;
              if (Math.abs(dx) > 60) setMobileTab(dx < 0 ? "preview" : "edit");
            }}
          >
            <AnimatedPane active={mobileTab === "edit"}>
              <Editor
                ref={editorRef}
                value={content}
                onChange={setContent}
                onScroll={(top, h, ch) =>
                  setScrollRatio(h > ch ? top / (h - ch) : 0)
                }
                onCursorChange={onCursorChange}
                darkMode={isDark}
                fontFamily={settings.fontFamily}
                fontSize={settings.fontSize}
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
          {mobileTab === "edit" && (
            <div className="mobile-format-bar">
              <button
                className="mobile-format-btn"
                style={{ fontWeight: 700 }}
                onPointerDown={(e) => {
                  e.preventDefault();
                  wrapSelection("**");
                }}
              >
                B
              </button>
              <button
                className="mobile-format-btn"
                style={{ fontStyle: "italic" }}
                onPointerDown={(e) => {
                  e.preventDefault();
                  wrapSelection("_");
                }}
              >
                I
              </button>
              <button
                className="mobile-format-btn mobile-format-mono"
                onPointerDown={(e) => {
                  e.preventDefault();
                  wrapSelection("`");
                }}
              >
                `
              </button>
              <button
                className="mobile-format-btn"
                onPointerDown={(e) => {
                  e.preventDefault();
                  insertLink();
                }}
              >
                Link
              </button>
              <span className="mobile-format-sep" />
              <button
                className="mobile-format-btn"
                onPointerDown={(e) => {
                  e.preventDefault();
                  insertHeading(1);
                }}
              >
                H1
              </button>
              <button
                className="mobile-format-btn"
                onPointerDown={(e) => {
                  e.preventDefault();
                  insertHeading(2);
                }}
              >
                H2
              </button>
              <button
                className="mobile-format-btn"
                onPointerDown={(e) => {
                  e.preventDefault();
                  insertHeading(3);
                }}
              >
                H3
              </button>
              <span className="mobile-format-sep" />
              <button
                className="mobile-format-btn"
                onPointerDown={(e) => {
                  e.preventDefault();
                  insertPrefix("> ");
                }}
              >
                ❝
              </button>
              <button
                className="mobile-format-btn"
                onPointerDown={(e) => {
                  e.preventDefault();
                  insertPrefix("- ");
                }}
              >
                •—
              </button>
              <button
                className="mobile-format-btn mobile-format-mono"
                onPointerDown={(e) => {
                  e.preventDefault();
                  insertCodeBlock();
                }}
              >
                {"{}"}
              </button>
            </div>
          )}
          <StatusBar
            line={cursor.line}
            col={cursor.col}
            wordCount={countWords(content)}
            charCount={content.length}
          />
          <nav className="mobile-tabs">
            <button
              className={`tab-btn${mobileTab === "edit" ? " active" : ""}`}
              onClick={() => setMobileTab("edit")}
            >
              <PenLine size={15} />
              Edit
            </button>
            <button
              className={`tab-btn${mobileTab === "preview" ? " active" : ""}`}
              onClick={() => setMobileTab("preview")}
            >
              <Eye size={15} />
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
              onCursorChange={onCursorChange}
              darkMode={isDark}
              fontFamily={settings.fontFamily}
              fontSize={settings.fontSize}
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

      {!isMobile && (
        <StatusBar
          line={cursor.line}
          col={cursor.col}
          wordCount={countWords(content)}
          charCount={content.length}
        />
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
        onExportComplete={() => showToast("PDF exported ✓")}
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
