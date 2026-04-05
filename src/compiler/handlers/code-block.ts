import type { Code } from 'mdast';
import type { IndexTracker } from '../index-tracker.js';
import type { CompilerContext, HandlerResult } from './index.js';
import * as rb from '../request-builder.js';

export function handleCodeBlock(
  node: Code,
  tracker: IndexTracker,
  _context: CompilerContext,
): HandlerResult {
  // Insert literal fence markers as text so they survive Google Docs export.
  // Google escapes backticks (\`) on export, but our normalizer unescapes them.
  const lang = node.lang ?? '';
  // Use longer fence if content contains backtick sequences
  const maxRun = (node.value.match(/`+/g) ?? []).reduce((m, s) => Math.max(m, s.length), 0);
  const fence = '`'.repeat(Math.max(3, maxRun + 1));
  const openFence = fence + lang + '\n';
  const closeFence = fence + '\n';
  const content = node.value.length === 0 ? '' : node.value + '\n';
  const text = openFence + content + closeFence;

  const range = tracker.insert(text);

  // Trailing blank line after code block
  const newline = tracker.insert('\n');

  const insertions = [
    rb.insertText(text, range.startIndex),
    rb.insertText('\n', newline.startIndex),
  ];

  // Apply monospace font to the entire block (fences + content)
  const styles = [
    rb.updateTextStyle(
      range,
      { weightedFontFamily: { fontFamily: 'Courier New', weight: 400 } },
      'weightedFontFamily',
    ),
    rb.updateParagraphStyle(
      range,
      {
        shading: {
          backgroundColor: {
            color: { rgbColor: { red: 0.95, green: 0.95, blue: 0.95 } },
          },
        },
        namedStyleType: 'NORMAL_TEXT',
      },
      'shading,namedStyleType',
    ),
  ];

  return { insertions, styles };
}
