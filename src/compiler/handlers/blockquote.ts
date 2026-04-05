import type { Blockquote } from 'mdast';
import type { IndexTracker } from '../index-tracker.js';
import type { CompilerContext, HandlerResult } from './index.js';
import * as rb from '../request-builder.js';

export function handleBlockquote(
  node: Blockquote,
  tracker: IndexTracker,
  context: CompilerContext,
  compileChildren: (node: Blockquote, tracker: IndexTracker, context: CompilerContext) => HandlerResult,
): HandlerResult {
  const startIndex = tracker.current;
  const childContext: CompilerContext = { ...context, insideBlockquote: true };
  const childResult = compileChildren(node, tracker, childContext);
  const endIndex = tracker.current;

  childResult.styles.push(
    rb.updateParagraphStyle(
      { startIndex, endIndex },
      {
        indentStart: { magnitude: 36, unit: 'PT' },
        borderLeft: {
          color: {
            color: { rgbColor: { red: 0.75, green: 0.75, blue: 0.75 } },
          },
          width: { magnitude: 3, unit: 'PT' },
          padding: { magnitude: 6, unit: 'PT' },
          dashStyle: 'SOLID',
        },
      },
      'indentStart,borderLeft',
    ),
  );

  return childResult;
}
