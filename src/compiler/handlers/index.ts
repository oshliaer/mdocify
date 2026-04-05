import type { Node } from 'mdast';
import type { BatchRequest } from '../../types/google-docs.js';
import type { IndexTracker } from '../index-tracker.js';

export interface CompilerContext {
  listDepth: number;
  insideTable: boolean;
  insideBlockquote: boolean;
}

export interface HandlerResult {
  insertions: BatchRequest[];
  styles: BatchRequest[];
}

export type NodeHandler = (
  node: Node,
  tracker: IndexTracker,
  context: CompilerContext,
  compileChildren: (node: Node, tracker: IndexTracker, context: CompilerContext) => HandlerResult,
) => HandlerResult;

export function createContext(): CompilerContext {
  return {
    listDepth: 0,
    insideTable: false,
    insideBlockquote: false,
  };
}

export function mergeResults(...results: HandlerResult[]): HandlerResult {
  return {
    insertions: results.flatMap((r) => r.insertions),
    styles: results.flatMap((r) => r.styles),
  };
}

export { handleHeading } from './heading.js';
export { handleParagraph } from './paragraph.js';
export { handleText } from './text.js';
export { handleEmphasis } from './emphasis.js';
export { handleStrong } from './strong.js';
export { handleDelete } from './delete.js';
export { handleLink } from './link.js';
export { handleCode } from './code.js';
export { handleCodeBlock } from './code-block.js';
export { handleList } from './list.js';
export { handleTable } from './table.js';
export { handleBlockquote } from './blockquote.js';
export { handleThematicBreak } from './thematic-break.js';
export { handleImage } from './image.js';
