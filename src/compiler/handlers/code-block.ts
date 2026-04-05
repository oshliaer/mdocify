import type { Code } from 'mdast';
import type { IndexTracker } from '../index-tracker.js';
import type { CompilerContext, HandlerResult } from './index.js';
import * as rb from '../request-builder.js';

export function handleCodeBlock(
  node: Code,
  tracker: IndexTracker,
  _context: CompilerContext,
): HandlerResult {
  const text = node.value + '\n';
  const range = tracker.insert(text);

  const newline = tracker.insert('\n');

  const insertions = [
    rb.insertText(text, range.startIndex),
    rb.insertText('\n', newline.startIndex),
  ];

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
