import type { Emphasis } from 'mdast';
import type { IndexTracker } from '../index-tracker.js';
import type { CompilerContext, HandlerResult } from './index.js';
import * as rb from '../request-builder.js';

export function handleEmphasis(
  node: Emphasis,
  tracker: IndexTracker,
  context: CompilerContext,
  compileChildren: (node: Emphasis, tracker: IndexTracker, context: CompilerContext) => HandlerResult,
): HandlerResult {
  const startIndex = tracker.current;
  const childResult = compileChildren(node, tracker, context);
  const endIndex = tracker.current;

  childResult.styles.push(
    rb.updateTextStyle(
      { startIndex, endIndex },
      { italic: true },
      'italic',
    ),
  );

  return childResult;
}
