import type { Image } from 'mdast';
import type { IndexTracker } from '../index-tracker.js';
import type { CompilerContext, HandlerResult } from './index.js';
import * as rb from '../request-builder.js';

export function handleImage(
  node: Image,
  tracker: IndexTracker,
  _context: CompilerContext,
): HandlerResult {
  const index = tracker.current;
  // Inline image takes 1 index position
  tracker.advance(1);

  const newline = tracker.insert('\n');

  return {
    insertions: [
      rb.insertInlineImage(node.url, index),
      rb.insertText('\n', newline.startIndex),
    ],
    styles: [],
  };
}
