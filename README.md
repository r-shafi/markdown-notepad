# Gulbahar Notes

A fully local, open-source Markdown notepad with live preview, customizable themes & fonts, rich keyboard shortcuts, and flexible PDF export — all running entirely in your browser.

## Features

- **Live split-pane preview** — see rendered Markdown as you type, with synchronized scrolling
- **Syntax highlighting** — fenced code blocks with automatic language detection via highlight.js
- **10 built-in themes** — switch themes instantly with keyboard shortcuts or the toolbar
- **23 font options** — choose from Google Fonts (Merriweather, Inter, Poppins, Lora, JetBrains Mono, and more) for both the editor and preview
- **PDF export** — exports with smart page breaking (never cuts through text), configurable font size, optional theme styling, and optional watermark
- **Rich keyboard shortcuts** — format text, insert links/images/code blocks, duplicate lines, toggle comments, and more without touching the mouse
- **Command palette** — fuzzy-search all commands with `Ctrl+P`
- **Markdown extensions** — footnotes, definition lists, task lists, external link safety
- **Fully local** — no account, no server, no data sent anywhere; content persists in `localStorage`

## Keyboard Shortcuts

| Shortcut          | Action              |
| ----------------- | ------------------- |
| `Ctrl+B`          | Bold                |
| `Ctrl+I`          | Italic              |
| `Ctrl+K`          | Insert link         |
| `Ctrl+Shift+I`    | Insert image        |
| `Ctrl+Shift+K`    | Insert code block   |
| `Ctrl+/`          | Toggle comment      |
| `Ctrl+D`          | Duplicate line      |
| `Ctrl+Shift+F`    | Format document     |
| `Ctrl+P`          | Command palette     |
| `Ctrl+Shift+P`    | Toggle preview      |
| `Ctrl+S`          | Export PDF          |
| `Ctrl+E`          | Export PDF          |
| `Ctrl+,`          | Editor settings     |
| `Ctrl+Shift+V`    | Paste as plain text |
| `Ctrl+1`–`Ctrl+0` | Switch theme 1–10   |

## Getting Started

```bash
# Install dependencies
pnpm install

# Start dev server
pnpm dev

# Build for production
pnpm build
```

The dev server runs on `http://localhost:4000` by default.

## Tech Stack

- [React 18](https://react.dev) + [TypeScript](https://www.typescriptlang.org) + [Vite](https://vitejs.dev)
- [CodeMirror 6](https://codemirror.net) — editor
- [markdown-it](https://github.com/markdown-it/markdown-it) — Markdown rendering
- [highlight.js](https://highlightjs.org) — syntax highlighting
- [jsPDF](https://github.com/parallax/jsPDF) + [html2canvas](https://html2canvas.hertzen.com) — PDF export
- [cmdk](https://cmdk.paco.me) — command palette
- [framer-motion](https://www.framer.com/motion) — animations
- [lucide-react](https://lucide.dev) — icons
- [Prettier](https://prettier.io) — in-browser document formatting

## License

MIT
