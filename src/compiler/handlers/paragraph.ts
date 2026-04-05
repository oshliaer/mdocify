import type { Paragraph } from 'mdast';
import type { IndexTracker } from '../index-tracker.js';
import type { CompilerContext, HandlerResult } from './index.js';
import * as rb from '../request-builder.js';

export function handleParagraph(
  node: Paragraph,
  tracker: IndexTracker,
  context: CompilerContext,
  compileChildren: (node: Paragraph, tracker: IndexTracker, context: CompilerContext) => HandlerResult,
): HandlerResult {
  const childResult = compileChildren(node, tracker, context);

  const newline = tracker.insert('\n');
  childResult.insertions.push(rb.insertText('\n', newline.startIndex));

  return childResult;
}
