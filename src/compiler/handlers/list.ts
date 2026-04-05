import type { List, ListItem } from 'mdast';
import type { IndexTracker } from '../index-tracker.js';
import type { CompilerContext, HandlerResult } from './index.js';
import type { BatchRequest, Range } from '../../types/google-docs.js';
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

  const childContext: CompilerContext = {
    ...context,
    listDepth: context.listDepth + 1,
  };

  for (const item of node.children as ListItem[]) {
    const itemResult = compileListItem(item, tracker, childContext, compileChildren);

    insertions.push(...itemResult.insertions);
    styles.push(...itemResult.styles);

    // Apply bullets only to this item's own paragraph ranges, not nested sublists
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
  compileChildren: (node: any, tracker: IndexTracker, context: CompilerContext) => HandlerResult,
): ListItemResult {
  const allInsertions: BatchRequest[] = [];
  const allStyles: BatchRequest[] = [];
  const paragraphRanges: Range[] = [];

  for (const child of node.children) {
    if (child.type === 'list') {
      // Nested list — compiled recursively, gets its own bullet ranges
      const listResult = handleList(child as List, tracker, context, compileChildren);
      allInsertions.push(...listResult.insertions);
      allStyles.push(...listResult.styles);
    } else {
      // Track paragraph range for bullet application (only top-level paragraphs)
      const paragraphStart = tracker.current;
      const result = compileChildren(child as any, tracker, context);
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
