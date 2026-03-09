interface StatusBarProps {
  line: number;
  col: number;
  wordCount: number;
  charCount: number;
  themeName: string;
}

export default function StatusBar({
  line,
  col,
  wordCount,
  charCount,
  themeName,
}: StatusBarProps) {
  return (
    <div className="status-bar">
      <span className="status-item">Ln {line}</span>
      <span className="status-item">Col {col}</span>
      <span className="status-sep" />
      <span className="status-item">{wordCount} words</span>
      <span className="status-item">{charCount} chars</span>
      <a
        href="https://gulbahar.tech/"
        target="_blank"
        rel="noopener noreferrer"
        className="status-item status-ad"
      >
        visit gulbahar.tech
      </a>
      <span className="status-spacer" />
      <span className="status-item status-theme">{themeName}</span>
    </div>
  );
}
