import type { InlineCode } from 'mdast';
import type { IndexTracker } from '../index-tracker.js';
import type { CompilerContext, HandlerResult } from './index.js';
import * as rb from '../request-builder.js';

export function handleCode(
  node: InlineCode,
  tracker: IndexTracker,
  _context: CompilerContext,
): HandlerResult {
  const range = tracker.insert(node.value);

  return {
    insertions: [rb.insertText(node.value, range.startIndex)],
    styles: [
      rb.updateTextStyle(
        range,
        { weightedFontFamily: { fontFamily: 'Courier New', weight: 400 } },
        'weightedFontFamily',
      ),
    ],
  };
}
