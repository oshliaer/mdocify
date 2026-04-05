# Google Docs Markdown Export: Discovery Test

**Date:** 2026-04-05
**Document:** `mdocify-discovery-test`
**Document ID:** `<redacted>`
**Export MIME type:** `text/markdown`

## Raw Export Output

```markdown
# Heading 1 Test

## Heading 2 Test

### Heading 3 Test

This paragraph has **bold text**, *italic text*, ~~strikethrough text~~, a [link to example](https://example.com), and inline code here.

* First unordered item  
* Nested unordered item  
* Second unordered item  
1. First ordered item  
2. Second ordered item

function hello() {  
  console.log("Hello World");  
}  
This is a blockquote paragraph.  
\_\_\_  
E \= mc²

| Header A | Header B |
| :---- | :---- |
| Value 1 | Value 2 |
```

## Findings

### 1. Headings

- HEADING_1 -> `# ...`
- HEADING_2 -> `## ...`
- HEADING_3 -> `### ...`
- Each heading is followed by a blank line.
- **Verdict:** Standard ATX headings. Works correctly.

### 2. Bold / Italic / Strikethrough

- Bold (`textStyle.bold: true`) -> `**text**`
- Italic (`textStyle.italic: true`) -> `*text*`
- Strikethrough (`textStyle.strikethrough: true`) -> `~~text~~`
- **Verdict:** Standard markdown inline formatting. Works correctly.

### 3. Links

- `textStyle.link.url` -> `[visible text](url)`
- **Verdict:** Standard markdown link syntax. Works correctly.

### 4. Inline Code

- Applied via `weightedFontFamily.fontFamily: "Courier New"` (monospace font).
- **Export result:** No backtick wrapping. Google does NOT detect monospace font and convert to `` `code` ``.
- **Verdict: LOSS.** Inline code styled with Courier New is exported as plain text. Google Docs has no semantic "inline code" concept -- only visual font changes.

### 5. Unordered Lists

- `createParagraphBullets` with `BULLET_DISC_CIRCLE_SQUARE` -> `* item`
- **Nesting:** The nested item (indented via `indentStart`) was NOT exported as nested. All three items appear at the same level: `* item`.
- Trailing two spaces (`  `) after each item (soft line break).
- **Verdict: PARTIAL LOSS.** Flat list works. Nesting information is lost in the export -- all bullet items become top-level `*` items regardless of indent level.

### 6. Ordered Lists

- `createParagraphBullets` with `NUMBERED_DECIMAL_ALPHA_ROMAN` -> `1.`, `2.` etc.
- **Verdict:** Works correctly with standard numbered list syntax.

### 7. Fenced Code Blocks

- There is no native "code block" concept in Google Docs.
- Text styled with Courier New font is exported as plain paragraphs with trailing `  ` (two spaces).
- **No fenced code block (` ``` `) is generated.** No language tag is preserved.
- **Verdict: TOTAL LOSS.** Google Docs cannot represent fenced code blocks. Monospace-font paragraphs export as regular text.

### 8. Tables

- Google Docs native tables export as pipe-delimited markdown tables.
- Format: `| cell | cell |` with `| :---- | :---- |` separator row.
- Column alignment defaults to `:----` (left-aligned).
- **Verdict:** Works correctly. Clean GFM table syntax.

### 9. Blockquotes

- Google Docs has no native "blockquote" element.
- Paragraph with increased `indentStart` (36pt) exports as a regular paragraph, NOT as `> blockquote`.
- **Verdict: TOTAL LOSS.** There is no way to represent blockquotes in Google Docs that survives markdown export.

### 10. Horizontal Rules / Thematic Breaks

- Text `___` (three underscores) in a paragraph is exported as `\_\_\_` with underscores escaped.
- Google Docs has no native horizontal rule element.
- **Verdict: TOTAL LOSS.** No `---` or `***` thematic break is generated. The underscores are escaped, preventing markdown rendering as a rule.

### 11. Special Characters and Escaping

- `=` is escaped as `\=` in the export.
- `_` is escaped as `\_`.
- Superscript `²` (Unicode) is preserved as-is.
- **Verdict:** Google aggressively escapes characters that could be interpreted as markdown syntax. This is safe but may produce unexpected escapes.

### 12. Line Endings

- Most lines end with two trailing spaces (`  `) which creates soft line breaks in markdown.
- Blank lines separate major sections (headings, paragraphs, lists).
- **Verdict:** The trailing spaces are intentional HTML-style line breaks. May need cleanup.

### 13. Math Formulas

- No native math/LaTeX support in Google Docs export.
- `E = mc²` exports as `E \= mc²` (with escaped equals sign).
- **Verdict: LOSS.** No `$...$` or LaTeX math syntax is generated.

## Summary Table

| Element | Google Docs Representation | Export Quality |
|---------|---------------------------|----------------|
| Headings (H1-H3) | `namedStyleType: HEADING_N` | PERFECT |
| Bold | `textStyle.bold: true` | PERFECT |
| Italic | `textStyle.italic: true` | PERFECT |
| Strikethrough | `textStyle.strikethrough: true` | PERFECT |
| Links | `textStyle.link.url` | PERFECT |
| Inline code | Courier New font | LOST (no backticks) |
| Unordered list | `createParagraphBullets` | PARTIAL (nesting lost) |
| Ordered list | `createParagraphBullets` | PERFECT |
| Fenced code block | N/A (no native support) | LOST |
| Table | Native table element | PERFECT |
| Blockquote | N/A (no native support) | LOST |
| Horizontal rule | N/A (no native support) | LOST |
| Math formula | N/A | LOST |

## Implications for mdocify

The following elements need **special handling** when converting markdown to Google Docs, because they will NOT survive a round-trip:

1. **Inline code** -- Needs a convention beyond just font (perhaps background color + font, or a named style workaround).
2. **Fenced code blocks** -- No native equivalent. Could possibly be stored as a single-cell table with monospace font, but language tag will be lost.
3. **Blockquotes** -- No native equivalent. Indent-based approach does not export as `>`.
4. **Horizontal rules** -- No native equivalent. 
5. **Nested lists** -- Nesting depth is lost on export.
6. **Math** -- No LaTeX round-trip possible.

## Reference Files

- Export: `discovery-export.md`
- Full doc JSON: `discovery-doc.json`
