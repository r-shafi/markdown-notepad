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
import { Eye, List, PenLine, Quote } from "lucide-react";
import { createCommands } from "./commands";
import { DEFAULT_DOCUMENT } from "./defaultDocument";
import { useCommandPalette } from "./hooks/useCommandPalette";
import { useEditorActions } from "./hooks/useEditorActions";
import { useEditorSettings } from "./hooks/useEditorSettings";
import { useKeyboardShortcuts } from "./hooks/useKeyboardShortcuts";
import { useTheme } from "./hooks/useTheme";
import { themes } from "./themes";
import type { CursorPosition } from "./types";
import prettier from "prettier/standalone";
import parserMarkdown from "prettier/plugins/markdown";

const CONTENT_KEY = "gulbahar-notes-content";
const SPLIT_KEY = "gulbahar-notes-split-ratio";

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
      localStorage.getItem("gulbahar-notes-content") ??
      DEFAULT_DOCUMENT,
  );
  const [splitRatio, setSplitRatio] = useState<number>(() =>
    Number(
      localStorage.getItem(SPLIT_KEY) ??
        localStorage.getItem("gulbahar-notes-split") ??
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
  const [syncScroll, setSyncScroll] = useState(() => {
    const stored = localStorage.getItem("gulbahar-notes-sync-scroll");
    return stored === null ? true : stored === "true";
  });

  const editorRef = useRef<ReactCodeMirrorRef>(null);
  const dragging = useRef(false);
  const touchStartX = useRef<number>(0);
  const { theme, themeId, setTheme } = useTheme();
  const palette = useCommandPalette();
  const { settings, updateFontFamily, updateFontSize } = useEditorSettings();
  const {
    wrapSelection,
    insertLink,
    insertImage,
    insertCodeBlock,
    duplicateLine,
    toggleComment,
    insertHeading,
    insertPrefix,
  } = useEditorActions(editorRef);

  useEffect(() => {
    localStorage.setItem(CONTENT_KEY, content);
  }, [content]);

  useEffect(() => {
    localStorage.setItem(SPLIT_KEY, String(splitRatio));
  }, [splitRatio]);

  useEffect(() => {
    const handler = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener("resize", handler);
    return () => window.removeEventListener("resize", handler);
  }, []);

  const showToast = useCallback((msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 2500);
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

        const targetLine = Math.min(cursorLine, view.state.doc.lines);
        const lineInfo = view.state.doc.line(targetLine);
        view.dispatch({
          selection: { anchor: lineInfo.from },
        });
      } else {
        setContent(formatted);
      }
      showToast("Document formatted");
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
    showToast("Document saved");
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
    } catch {}
  }, []);

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

  const commands = useMemo(
    () =>
      createCommands({
        wrapSelection,
        insertLink,
        insertImage,
        insertCodeBlock,
        formatDoc,
        toggleComment,
        duplicateLine,
        saveAsMarkdown,
        pasteAsPlainText,
        openExport: () => setExportOpen(true),
        togglePreview: () => setShowPreview((v) => !v),
        setTheme,
        themes,
      }),
    [
      wrapSelection,
      insertLink,
      insertImage,
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
    insertImage,
    insertCodeBlock,
    formatDoc,
    openPalette: palette.toggle,
    exportPDF: () => setExportOpen(true),
    saveDoc: saveAsMarkdown,
    toggleComment,
    duplicateLine,
    togglePreview: () => setShowPreview((v) => !v),
    pasteAsPlainText,
    openSettings: () => setSettingsOpen((v) => !v),
    switchTheme: (i) => {
      if (themes[i]) setTheme(themes[i].id);
    },
  });

  const onCursorChange = useCallback((pos: CursorPosition) => {
    setCursor(pos);
  }, []);

  const handleEditorScroll = useCallback(
    (top: number, h: number, ch: number) => {
      setScrollRatio(h > ch ? top / (h - ch) : 0);
    },
    [],
  );

  const wordCount = useMemo(() => countWords(content), [content]);

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
        syncScroll={syncScroll}
        onToggleSyncScroll={() => {
          setSyncScroll((v) => {
            localStorage.setItem("gulbahar-notes-sync-scroll", String(!v));
            return !v;
          });
        }}
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
                onScroll={handleEditorScroll}
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
                fontFamily={settings.fontFamily}
                fontSize={settings.fontSize}
                syncScroll={syncScroll}
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
                <Quote size={13} />
              </button>
              <button
                className="mobile-format-btn"
                onPointerDown={(e) => {
                  e.preventDefault();
                  insertPrefix("- ");
                }}
              >
                <List size={13} />
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
            wordCount={wordCount}
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
              onScroll={handleEditorScroll}
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
                fontFamily={settings.fontFamily}
                fontSize={settings.fontSize}
                syncScroll={syncScroll}
              />
            </div>
          )}
        </main>
      )}

      {!isMobile && (
        <StatusBar
          line={cursor.line}
          col={cursor.col}
          wordCount={wordCount}
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
        onExportComplete={() => showToast("PDF exported")}
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
