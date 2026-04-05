import type { Text } from 'mdast';
import type { IndexTracker } from '../index-tracker.js';
import type { CompilerContext, HandlerResult } from './index.js';
import * as rb from '../request-builder.js';

export function handleText(
  node: Text,
  tracker: IndexTracker,
  _context: CompilerContext,
): HandlerResult {
  const range = tracker.insert(node.value);
  return {
    insertions: [rb.insertText(node.value, range.startIndex)],
    styles: [],
  };
}
