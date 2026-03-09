import hljs from "highlight.js";
import MarkdownIt from "markdown-it";
import type { Options as MdOptions } from "markdown-it";
import type Token from "markdown-it/lib/token.mjs";
import type Renderer from "markdown-it/lib/renderer.mjs";
import { useEffect, useRef } from "react";

type RenderRule = NonNullable<Renderer["rules"][string]>;

// Configure markdown-it with full feature set
const md: MarkdownIt = new MarkdownIt({
  html: true,
  linkify: true,
  typographer: true,
  highlight(str: string, lang: string): string {
    if (lang && hljs.getLanguage(lang)) {
      try {
        return (
          `<pre class="hljs-pre"><code class="hljs language-${lang}">` +
          hljs.highlight(str, { language: lang, ignoreIllegals: true }).value +
          `</code><button class="copy-btn" data-code="${encodeURIComponent(str)}" title="Copy">Copy</button></pre>`
        );
      } catch {}
    }
    return (
      `<pre class="hljs-pre"><code class="hljs">` +
      md.utils.escapeHtml(str) +
      `</code></pre>`
    );
  },
});

// Enable plugins
md.enable(["table"]);

// Open external links in _blank
const defaultRender: RenderRule =
  md.renderer.rules.link_open ??
  ((
    tokens: Token[],
    idx: number,
    options: MdOptions,
    _env: unknown,
    self: Renderer,
  ) => self.renderToken(tokens, idx, options));

md.renderer.rules.link_open = (
  tokens: Token[],
  idx: number,
  options: MdOptions,
  env: unknown,
  self: Renderer,
) => {
  const href = tokens[idx].attrGet("href");
  if (href && (href.startsWith("http://") || href.startsWith("https://"))) {
    tokens[idx].attrSet("target", "_blank");
    tokens[idx].attrSet("rel", "noopener noreferrer");
  }
  return defaultRender(tokens, idx, options, env, self);
};

// Task list support: replace [ ] and [x]
function processTaskList(html: string) {
  return html
    .replace(
      /<li>\s*\[ \]/g,
      '<li class="task-item"><input type="checkbox" disabled> ',
    )
    .replace(
      /<li>\s*\[x\]/gi,
      '<li class="task-item"><input type="checkbox" disabled checked> ',
    );
}

interface PreviewProps {
  content: string;
  scrollRatio: number;
  id?: string;
}

export default function Preview({ content, scrollRatio, id }: PreviewProps) {
  const ref = useRef<HTMLDivElement>(null);
  const raw = md.render(content);
  const html = processTaskList(raw);

  // Sync scroll position from editor
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const max = el.scrollHeight - el.clientHeight;
    el.scrollTop = scrollRatio * max;
  }, [scrollRatio]);

  // Handle copy buttons for code blocks
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    function handler(e: MouseEvent) {
      const btn = (e.target as HTMLElement).closest(
        ".copy-btn",
      ) as HTMLButtonElement | null;
      if (!btn) return;
      const code = decodeURIComponent(btn.dataset.code ?? "");
      navigator.clipboard.writeText(code).then(() => {
        const orig = btn.textContent;
        btn.textContent = "Copied!";
        setTimeout(() => {
          btn.textContent = orig;
        }, 1500);
      });
    }
    el.addEventListener("click", handler);
    return () => el.removeEventListener("click", handler);
  }, []);

  return (
    <div
      id={id}
      ref={ref}
      className="preview-pane"
      // biome-ignore reason: controlled sanitized HTML from markdown-it
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}
