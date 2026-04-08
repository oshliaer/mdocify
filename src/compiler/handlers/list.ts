import type { List, ListItem } from 'mdast';
import type { IndexTracker } from '../index-tracker.js';
import type { CompilerContext, HandlerResult } from './index.js';
import type { BatchRequest, Range } from '../../types/google-docs.js';
import * as rb from '../request-builder.js';

export type CompileNodeFn = (
  node: any,
  tracker: IndexTracker,
  context: CompilerContext,
) => HandlerResult;

export function handleList(
  node: List,
  tracker: IndexTracker,
  context: CompilerContext,
  compileChildren: CompileNodeFn,
  compileNode: CompileNodeFn,
): HandlerResult {
  const bulletPreset = node.ordered
    ? 'NUMBERED_DECIMAL_NESTED'
    : 'BULLET_DISC_CIRCLE_SQUARE';

  const insertions: BatchRequest[] = [];
  const styles: BatchRequest[] = [];

  const childContext: CompilerContext = {
    ...context,
    listDepth: context.listDepth + 1,
  };

  for (const item of node.children as ListItem[]) {
    const itemResult = compileListItem(item, tracker, childContext, compileChildren, compileNode);

    insertions.push(...itemResult.insertions);
    styles.push(...itemResult.styles);

    for (const range of itemResult.paragraphRanges) {
      styles.push(rb.createParagraphBullets(range, bulletPreset));
    }
  }

  return { insertions, styles };
}

interface ListItemResult extends HandlerResult {
  paragraphRanges: Range[];
}

function compileListItem(
  node: ListItem,
  tracker: IndexTracker,
  context: CompilerContext,
  compileChildren: CompileNodeFn,
  compileNode: CompileNodeFn,
): ListItemResult {
  const allInsertions: BatchRequest[] = [];
  const allStyles: BatchRequest[] = [];
  const paragraphRanges: Range[] = [];

  for (const child of node.children) {
    if (child.type === 'list') {
      const listResult = handleList(child as List, tracker, context, compileChildren, compileNode);
      allInsertions.push(...listResult.insertions);
      allStyles.push(...listResult.styles);
    } else {
      const paragraphStart = tracker.current;
      // Use compileNode (not compileChildren) so paragraph handler adds \n
      const result = compileNode(child as any, tracker, context);
      const paragraphEnd = tracker.current;

      allInsertions.push(...result.insertions);
      allStyles.push(...result.styles);

      if (child.type === 'paragraph') {
        paragraphRanges.push({ startIndex: paragraphStart, endIndex: paragraphEnd });
      }
    }
  }

  return { insertions: allInsertions, styles: allStyles, paragraphRanges };
}
