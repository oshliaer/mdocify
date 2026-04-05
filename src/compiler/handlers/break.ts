import type { Break } from 'mdast';
import type { IndexTracker } from '../index-tracker.js';
import type { CompilerContext, HandlerResult } from './index.js';
import * as rb from '../request-builder.js';

export function handleBreak(
  _node: Break,
  tracker: IndexTracker,
  _context: CompilerContext,
): HandlerResult {
  const range = tracker.insert('\n');
  return {
    insertions: [rb.insertText('\n', range.startIndex)],
    styles: [],
  };
}
