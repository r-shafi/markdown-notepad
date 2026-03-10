import { memo } from "react";

interface StatusBarProps {
  line: number;
  col: number;
  wordCount: number;
  charCount: number;
}

export default memo(function StatusBar({
  line,
  col,
  wordCount,
  charCount,
}: StatusBarProps) {
  return (
    <div className="status-bar">
      <span className="status-item">Ln {line}</span>
      <span className="status-item">Col {col}</span>
      <span className="status-sep" />
      <span className="status-item">{wordCount} words</span>
      <span className="status-item">{charCount} chars</span>
      <span className="status-spacer" />
      <a
        href="https://gulbahar.tech/"
        target="_blank"
        rel="noopener noreferrer"
        className="status-item status-ad"
      >
        gulbahar.tech
      </a>
    </div>
  );
});
