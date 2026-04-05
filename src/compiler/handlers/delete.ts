import type { Delete } from 'mdast';
import type { IndexTracker } from '../index-tracker.js';
import type { CompilerContext, HandlerResult } from './index.js';
import * as rb from '../request-builder.js';

export function handleDelete(
  node: Delete,
  tracker: IndexTracker,
  context: CompilerContext,
  compileChildren: (node: Delete, tracker: IndexTracker, context: CompilerContext) => HandlerResult,
): HandlerResult {
  const startIndex = tracker.current;
  const childResult = compileChildren(node, tracker, context);
  const endIndex = tracker.current;

  childResult.styles.push(
    rb.updateTextStyle(
      { startIndex, endIndex },
      { strikethrough: true },
      'strikethrough',
    ),
  );

  return childResult;
}
