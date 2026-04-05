import type { List, ListItem } from 'mdast';
import type { IndexTracker } from '../index-tracker.js';
import type { CompilerContext, HandlerResult } from './index.js';
import type { BatchRequest } from '../../types/google-docs.js';
import * as rb from '../request-builder.js';

export function handleList(
  node: List,
  tracker: IndexTracker,
  context: CompilerContext,
  compileChildren: (node: any, tracker: IndexTracker, context: CompilerContext) => HandlerResult,
): HandlerResult {
  const bulletPreset = node.ordered
    ? 'NUMBERED_DECIMAL_NESTED'
    : 'BULLET_DISC_CIRCLE_SQUARE';

  const insertions: BatchRequest[] = [];
  const styles: BatchRequest[] = [];
  const bulletRanges: { startIndex: number; endIndex: number }[] = [];

  const childContext: CompilerContext = {
    ...context,
    listDepth: context.listDepth + 1,
  };

  for (const item of node.children as ListItem[]) {
    const itemStart = tracker.current;
    const itemResult = compileListItem(item, tracker, childContext, compileChildren);
    const itemEnd = tracker.current;

    insertions.push(...itemResult.insertions);
    styles.push(...itemResult.styles);
    bulletRanges.push({ startIndex: itemStart, endIndex: itemEnd });
  }

  for (const range of bulletRanges) {
    styles.push(rb.createParagraphBullets(range, bulletPreset));
  }

  return { insertions, styles };
}

function compileListItem(
  node: ListItem,
  tracker: IndexTracker,
  context: CompilerContext,
  compileChildren: (node: any, tracker: IndexTracker, context: CompilerContext) => HandlerResult,
): HandlerResult {
  const allInsertions: BatchRequest[] = [];
  const allStyles: BatchRequest[] = [];

  for (const child of node.children) {
    if (child.type === 'list') {
      const listResult = handleList(child as List, tracker, context, compileChildren);
      allInsertions.push(...listResult.insertions);
      allStyles.push(...listResult.styles);
    } else {
      const result = compileChildren(child as any, tracker, context);
      allInsertions.push(...result.insertions);
      allStyles.push(...result.styles);

      if (child.type === 'paragraph') {
        // paragraph handler already adds \n
      }
    }
  }

  return { insertions: allInsertions, styles: allStyles };
}
