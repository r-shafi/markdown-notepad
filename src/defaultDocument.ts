export const DEFAULT_DOCUMENT = `# Welcome to MarkPad

A fast, beautiful Markdown editor. Start writing — your work is saved automatically.

---

## Headings

# H1 Heading
## H2 Heading
### H3 Heading
#### H4 Heading
##### H5 Heading
###### H6 Heading

---

## Emphasis

**Bold text** and *italic text* and ~~strikethrough~~ and \`inline code\`.

---

## Lists

- Item one
- Item two
  - Nested item
  - Another nested

1. First ordered item
2. Second ordered item
3. Third ordered item

### Task List

- [x] Set up MarkPad
- [x] Choose a theme
- [ ] Write something great
- [ ] Export to PDF

---

## Blockquote

> "The scariest moment is always just before you start."
> — Stephen King

---

## Code Block

\`\`\`javascript
function greet(name) {
  const message = \`Hello, \${name}!\`;
  console.log(message);
  return message;
}

greet('MarkPad');
\`\`\`

---

## Table

| Feature         | Status  | Notes               |
| --------------- | ------- | ------------------- |
| Markdown editor | ✅ Done  | CodeMirror 6        |
| Live preview    | ✅ Done  | markdown-it         |
| 10 Themes       | ✅ Done  | Obsidian-inspired   |
| PDF Export      | ✅ Done  | jsPDF + html2canvas |
| Command Palette | ✅ Done  | cmdk                |

---

## Image

![Sample Image](https://picsum.photos/seed/markpad/800/400)

---

## Footnote

This sentence has a footnote.[^1]

[^1]: This is the footnote content.

---

## Horizontal Rule

Above the rule.

---

Below the rule.
`;
