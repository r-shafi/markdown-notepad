declare module "markdown-it-footnote" {
  import type MarkdownIt from "markdown-it";
  const footnote: MarkdownIt.PluginSimple;
  export default footnote;
}

declare module "markdown-it-deflist" {
  import type MarkdownIt from "markdown-it";
  const deflist: MarkdownIt.PluginSimple;
  export default deflist;
}
