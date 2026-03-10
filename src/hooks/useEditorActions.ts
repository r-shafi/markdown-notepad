import type { ReactCodeMirrorRef } from "@uiw/react-codemirror";
import { useCallback } from "react";

export function useEditorActions(
  editorRef: React.RefObject<ReactCodeMirrorRef | null>,
) {
  const wrapSelection = useCallback(
    (before: string, after = before) => {
      const view = editorRef.current?.view;
      if (!view) return;
      const { from, to } = view.state.selection.main;
      const selected = view.state.doc.sliceString(from, to);
      view.dispatch({
        changes: { from, to, insert: `${before}${selected}${after}` },
        selection: { anchor: from + before.length, head: to + before.length },
      });
    },
    [editorRef],
  );

  const insertLink = useCallback(() => {
    const view = editorRef.current?.view;
    if (!view) return;
    const { from, to } = view.state.selection.main;
    const selected = view.state.doc.sliceString(from, to);
    if (selected) {
      const replacement = `[${selected}](url)`;
      view.dispatch({
        changes: { from, to, insert: replacement },
        selection: {
          anchor: from + selected.length + 3,
          head: from + selected.length + 6,
        },
      });
    } else {
      view.dispatch({
        changes: { from, insert: "[](url)" },
        selection: { anchor: from + 1 },
      });
    }
  }, [editorRef]);

  const insertImage = useCallback(() => {
    const view = editorRef.current?.view;
    if (!view) return;
    const { from, to } = view.state.selection.main;
    const selected = view.state.doc.sliceString(from, to);
    if (selected) {
      const replacement = `![${selected}](url)`;
      view.dispatch({
        changes: { from, to, insert: replacement },
        selection: {
          anchor: from + selected.length + 4,
          head: from + selected.length + 7,
        },
      });
    } else {
      view.dispatch({
        changes: { from, insert: "![alt](url)" },
        selection: { anchor: from + 2, head: from + 5 },
      });
    }
  }, [editorRef]);

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
  }, [editorRef]);

  const duplicateLine = useCallback(() => {
    const view = editorRef.current?.view;
    if (!view) return;
    const { from } = view.state.selection.main;
    const line = view.state.doc.lineAt(from);
    view.dispatch({
      changes: { from: line.to, insert: `\n${line.text}` },
    });
  }, [editorRef]);

  const toggleComment = useCallback(() => {
    const view = editorRef.current?.view;
    if (!view) return;
    const { from, to } = view.state.selection.main;

    if (from === to) {
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
  }, [editorRef]);

  const insertHeading = useCallback(
    (level: number) => {
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
    },
    [editorRef],
  );

  const insertPrefix = useCallback(
    (prefix: string) => {
      const view = editorRef.current?.view;
      if (!view) return;
      const { from } = view.state.selection.main;
      const line = view.state.doc.lineAt(from);
      if (line.text.startsWith(prefix)) {
        view.dispatch({
          changes: {
            from: line.from,
            to: line.from + prefix.length,
            insert: "",
          },
        });
      } else {
        view.dispatch({
          changes: { from: line.from, insert: prefix },
          selection: { anchor: from + prefix.length },
        });
      }
    },
    [editorRef],
  );

  return {
    wrapSelection,
    insertLink,
    insertImage,
    insertCodeBlock,
    duplicateLine,
    toggleComment,
    insertHeading,
    insertPrefix,
  };
}
