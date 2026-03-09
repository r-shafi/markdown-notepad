import { BookOpen, Command, Download, Settings, WrapText } from "lucide-react";
import type { Theme } from "../types";

interface ToolbarProps {
  themes: Theme[];
  themeId: string;
  onThemeChange: (id: string) => void;
  onOpenPalette: () => void;
  onFormat: () => void;
  onExport: () => void;
  onToggleSettings: () => void;
  showPreview: boolean;
  onTogglePreview: () => void;
  isMobile: boolean;
}

export default function Toolbar({
  themes,
  themeId,
  onThemeChange,
  onOpenPalette,
  onFormat,
  onExport,
  onToggleSettings,
  showPreview,
  onTogglePreview,
  isMobile,
}: ToolbarProps) {
  return (
    <header className="toolbar">
      <span className="toolbar-brand">MarkPad</span>

      {/* Theme swatches */}
      <div className="theme-swatches">
        {themes.map((t) => (
          <button
            key={t.id}
            title={t.name}
            className={`theme-swatch${themeId === t.id ? " active" : ""}`}
            style={{ background: t.vars["--accent"] }}
            onClick={() => onThemeChange(t.id)}
          />
        ))}
      </div>

      <div className="toolbar-actions">
        <button
          className="toolbar-btn"
          title="Editor Settings"
          onClick={onToggleSettings}
        >
          <Settings size={16} />
        </button>
        {!isMobile && (
          <button
            className="toolbar-btn"
            title="Toggle Preview (Ctrl+Shift+P)"
            onClick={onTogglePreview}
          >
            {showPreview ? (
              <BookOpen size={16} />
            ) : (
              <BookOpen size={16} opacity={0.4} />
            )}
          </button>
        )}
        <button
          className="toolbar-btn"
          title="Format (Ctrl+Shift+F)"
          onClick={onFormat}
        >
          <WrapText size={16} />
        </button>
        <button
          className="toolbar-btn"
          title="Command Palette (Ctrl+P)"
          onClick={onOpenPalette}
        >
          <Command size={16} />
        </button>
        <button
          className="toolbar-btn toolbar-btn-accent"
          title="Export PDF (Ctrl+E)"
          onClick={onExport}
        >
          <Download size={16} />
          <span className="toolbar-btn-label">Export</span>
        </button>
      </div>
    </header>
  );
}
