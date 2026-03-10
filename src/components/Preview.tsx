import hljs from "highlight.js";
import MarkdownIt from "markdown-it";
import type { Options as MdOptions } from "markdown-it";
import type Token from "markdown-it/lib/token.mjs";
import type Renderer from "markdown-it/lib/renderer.mjs";
import footnote from "markdown-it-footnote";
import deflist from "markdown-it-deflist";
import { memo, useEffect, useMemo, useRef } from "react";

type RenderRule = NonNullable<Renderer["rules"][string]>;

const md: MarkdownIt = new MarkdownIt({
  html: true,
  linkify: true,
  typographer: true,
  highlight(str: string, lang: string): string {
    const escapedCode = encodeURIComponent(str);
    if (lang && hljs.getLanguage(lang)) {
      try {
        const highlighted = hljs.highlight(str, {
          language: lang,
          ignoreIllegals: true,
        }).value;
        return (
          `<pre class="hljs-pre"><span class="lang-badge">${lang}</span>` +
          `<code class="hljs language-${lang}">${highlighted}</code>` +
          `<button class="copy-btn" data-code="${escapedCode}" title="Copy">Copy</button></pre>`
        );
      } catch {}
    }
    return (
      `<pre class="hljs-pre"><code class="hljs">` +
      md.utils.escapeHtml(str) +
      `</code><button class="copy-btn" data-code="${escapedCode}" title="Copy">Copy</button></pre>`
    );
  },
});

md.use(footnote);
md.use(deflist);

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
  fontFamily?: string;
  fontSize?: number;
  syncScroll?: boolean;
}

export default memo(function Preview({
  content,
  scrollRatio,
  id,
  fontFamily,
  fontSize,
  syncScroll = true,
}: PreviewProps) {
  const ref = useRef<HTMLDivElement>(null);
  const html = useMemo(() => processTaskList(md.render(content)), [content]);

  useEffect(() => {
    if (!syncScroll) return;
    const el = ref.current;
    if (!el) return;
    const max = el.scrollHeight - el.clientHeight;
    el.scrollTop = scrollRatio * max;
  }, [scrollRatio, syncScroll]);

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
      style={
        {
          "--font-body": fontFamily,
          "--font-heading": fontFamily,
          fontSize: fontSize ? `${fontSize}px` : undefined,
        } as React.CSSProperties
      }
    >
      <div
        className="preview-content"
        dangerouslySetInnerHTML={{ __html: html }}
      />
    </div>
  );
});
