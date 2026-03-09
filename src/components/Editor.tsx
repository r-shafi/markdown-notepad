import CodeMirror, { type ReactCodeMirrorRef } from "@uiw/react-codemirror";
import { markdown, markdownLanguage } from "@codemirror/lang-markdown";
import { languages } from "@codemirror/language-data";
import { EditorView, keymap } from "@codemirror/view";
import { defaultKeymap, indentWithTab } from "@codemirror/commands";
import { oneDark } from "@codemirror/theme-one-dark";
import { forwardRef } from "react";

interface EditorProps {
  value: string;
  onChange: (value: string) => void;
  onScroll?: (
    scrollTop: number,
    scrollHeight: number,
    clientHeight: number,
  ) => void;
  darkMode: boolean;
}

const editorTheme = EditorView.theme({
  "&": {
    height: "100%",
    fontSize: "14px",
    fontFamily: "'JetBrains Mono', 'Fira Code', monospace",
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
  ".cm-activeLineGutter": { backgroundColor: "rgba(255,255,255,0.06)" },
});

const Editor = forwardRef<ReactCodeMirrorRef, EditorProps>(
  ({ value, onChange, onScroll, darkMode }, ref) => {
    return (
      <CodeMirror
        ref={ref}
        value={value}
        height="100%"
        theme={darkMode ? oneDark : "light"}
        extensions={[
          markdown({ base: markdownLanguage, codeLanguages: languages }),
          keymap.of([...defaultKeymap, indentWithTab]),
          editorTheme,
          EditorView.updateListener.of(
            (update: import("@codemirror/view").ViewUpdate) => {
              if (update.docChanged) return; // handled by onChange
              if (onScroll) {
                const scroller = update.view.scrollDOM;
                onScroll(
                  scroller.scrollTop,
                  scroller.scrollHeight,
                  scroller.clientHeight,
                );
              }
            },
          ),
          EditorView.domEventHandlers({
            scroll(_e: Event, view: import("@codemirror/view").EditorView) {
              if (onScroll) {
                const el = view.scrollDOM;
                onScroll(el.scrollTop, el.scrollHeight, el.clientHeight);
              }
            },
          }),
        ]}
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
