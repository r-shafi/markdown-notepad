import CodeMirror, { type ReactCodeMirrorRef } from "@uiw/react-codemirror";
import { markdown, markdownLanguage } from "@codemirror/lang-markdown";
import { languages } from "@codemirror/language-data";
import { EditorView, keymap } from "@codemirror/view";
import { defaultKeymap, indentWithTab } from "@codemirror/commands";
import { oneDark } from "@codemirror/theme-one-dark";
import { forwardRef, useMemo } from "react";
import type { CursorPosition } from "../types";

interface EditorProps {
  value: string;
  onChange: (value: string) => void;
  onScroll?: (
    scrollTop: number,
    scrollHeight: number,
    clientHeight: number,
  ) => void;
  onCursorChange?: (pos: CursorPosition) => void;
  darkMode: boolean;
  fontFamily?: string;
  fontSize?: number;
}

const Editor = forwardRef<ReactCodeMirrorRef, EditorProps>(
  (
    {
      value,
      onChange,
      onScroll,
      onCursorChange,
      darkMode,
      fontFamily = "'JetBrains Mono', monospace",
      fontSize = 15,
    },
    ref,
  ) => {
    const editorTheme = useMemo(
      () =>
        EditorView.theme({
          "&": {
            height: "100%",
            fontSize: `${fontSize}px`,
            fontFamily: fontFamily,
          },
          ".cm-scroller": { overflow: "auto", fontFamily: "inherit" },
          ".cm-content": { padding: "16px", minHeight: "100%" },
          ".cm-focused": { outline: "none" },
          ".cm-line": { lineHeight: "1.7" },
          ".cm-activeLine": { backgroundColor: "rgba(255,255,255,0.04)" },
          ".cm-gutters": {
            backgroundColor: "var(--bg-secondary)",
            borderRight: "1px solid var(--border)",
            color: "var(--text-secondary)",
            minWidth: "40px",
          },
          ".cm-activeLineGutter": {
            backgroundColor: "rgba(255,255,255,0.06)",
          },
        }),
      [fontFamily, fontSize],
    );

    const extensions = useMemo(
      () => [
        markdown({ base: markdownLanguage, codeLanguages: languages }),
        keymap.of([...defaultKeymap, indentWithTab]),
        editorTheme,
        EditorView.updateListener.of((update) => {
          if (onScroll && !update.docChanged) {
            const scroller = update.view.scrollDOM;
            onScroll(
              scroller.scrollTop,
              scroller.scrollHeight,
              scroller.clientHeight,
            );
          }
          // Report cursor position on any state change
          if (onCursorChange && (update.selectionSet || update.docChanged)) {
            const pos = update.state.selection.main.head;
            const line = update.state.doc.lineAt(pos);
            onCursorChange({
              line: line.number,
              col: pos - line.from + 1,
            });
          }
        }),
        EditorView.domEventHandlers({
          scroll(_e: Event, view: EditorView) {
            if (onScroll) {
              const el = view.scrollDOM;
              onScroll(el.scrollTop, el.scrollHeight, el.clientHeight);
            }
          },
        }),
      ],
      [editorTheme, onScroll, onCursorChange],
    );

    return (
      <CodeMirror
        ref={ref}
        value={value}
        height="100%"
        theme={darkMode ? oneDark : "light"}
        extensions={extensions}
        onChange={onChange}
        style={{ height: "100%", overflow: "hidden" }}
        basicSetup={{
          lineNumbers: true,
          highlightActiveLine: true,
          highlightActiveLineGutter: true,
          foldGutter: false,
          drawSelection: true,
          syntaxHighlighting: true,
        }}
      />
    );
  },
);

Editor.displayName = "Editor";

export default Editor;
