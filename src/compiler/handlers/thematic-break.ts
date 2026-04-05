import type { ThematicBreak } from 'mdast';
import type { IndexTracker } from '../index-tracker.js';
import type { CompilerContext, HandlerResult } from './index.js';
import * as rb from '../request-builder.js';

export function handleThematicBreak(
  _node: ThematicBreak,
  tracker: IndexTracker,
  _context: CompilerContext,
): HandlerResult {
  // Google Docs doesn't have a native horizontal rule.
  // We insert a line of dashes styled as a thin separator.
  const text = '─'.repeat(50) + '\n';
  const range = tracker.insert(text);

  return {
    insertions: [rb.insertText(text, range.startIndex)],
    styles: [
      rb.updateTextStyle(
        range,
        {
          foregroundColor: {
            color: { rgbColor: { red: 0.7, green: 0.7, blue: 0.7 } },
          },
          fontSize: { magnitude: 6, unit: 'PT' },
        },
        'foregroundColor,fontSize',
      ),
    ],
  };
}
