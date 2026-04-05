import type { Heading } from 'mdast';
import type { IndexTracker } from '../index-tracker.js';
import type { CompilerContext, HandlerResult } from './index.js';
import * as rb from '../request-builder.js';

const HEADING_STYLES: Record<number, string> = {
  1: 'HEADING_1',
  2: 'HEADING_2',
  3: 'HEADING_3',
  4: 'HEADING_4',
  5: 'HEADING_5',
  6: 'HEADING_6',
};

export function handleHeading(
  node: Heading,
  tracker: IndexTracker,
  context: CompilerContext,
  compileChildren: (node: Heading, tracker: IndexTracker, context: CompilerContext) => HandlerResult,
): HandlerResult {
  const startIndex = tracker.current;
  const childResult = compileChildren(node, tracker, context);

  const newline = tracker.insert('\n');
  childResult.insertions.push(rb.insertText('\n', newline.startIndex));

  const endIndex = tracker.current;
  const namedStyleType = HEADING_STYLES[node.depth] || 'HEADING_6';

  childResult.styles.push(
    rb.updateParagraphStyle(
      { startIndex, endIndex },
      { namedStyleType },
      'namedStyleType',
    ),
  );

  return childResult;
}
