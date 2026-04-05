import type { Root, Node, Content } from 'mdast';
import type { BatchRequest } from '../types/google-docs.js';
import { IndexTracker } from './index-tracker.js';
import {
  type CompilerContext,
  type HandlerResult,
  createContext,
  handleHeading,
  handleParagraph,
  handleBreak,
  handleText,
  handleEmphasis,
  handleStrong,
  handleDelete,
  handleLink,
  handleCode,
  handleCodeBlock,
  handleList,
  handleTable,
  handleBlockquote,
  handleThematicBreak,
  handleImage,
} from './handlers/index.js';
import type { TableCompileResult } from './handlers/table.js';

export interface CompileResult {
  requests: BatchRequest[];
  tables: TableCompileResult[];
}

export function compile(tree: Root): CompileResult {
  const tracker = new IndexTracker(1);
  const context = createContext();
  const tables: TableCompileResult[] = [];

  const result = compileNode(tree, tracker, context, tables);

  // Combine: insertions first (forward order), then styles (reverse order by index)
  const styles = result.styles.sort((a, b) => {
    const aIdx = getStartIndex(a);
    const bIdx = getStartIndex(b);
    return bIdx - aIdx; // reverse order
  });

  return {
    requests: [...result.insertions, ...styles],
    tables,
  };
}

function compileNode(
  node: Node,
  tracker: IndexTracker,
  context: CompilerContext,
  tables: TableCompileResult[],
): HandlerResult {
  if (node.type === 'root') {
    return compileChildNodes((node as Root).children, tracker, context, tables);
  }

  const childCompiler = (parent: Node, t: IndexTracker, c: CompilerContext): HandlerResult => {
    if ('children' in parent) {
      return compileChildNodes((parent as any).children, t, c, tables);
    }
    return { insertions: [], styles: [] };
  };

  switch (node.type) {
    case 'heading':
      return handleHeading(node as any, tracker, context, childCompiler);
    case 'paragraph':
      return handleParagraph(node as any, tracker, context, childCompiler);
    case 'text':
      return handleText(node as any, tracker, context);
    case 'emphasis':
      return handleEmphasis(node as any, tracker, context, childCompiler);
    case 'strong':
      return handleStrong(node as any, tracker, context, childCompiler);
    case 'delete':
      return handleDelete(node as any, tracker, context, childCompiler);
    case 'link':
      return handleLink(node as any, tracker, context, childCompiler);
    case 'inlineCode':
      return handleCode(node as any, tracker, context);
    case 'code':
      return handleCodeBlock(node as any, tracker, context);
    case 'list':
      return handleList(node as any, tracker, context, childCompiler);
    case 'table': {
      const tableResult = handleTable(node as any, tracker, context);
      tables.push(tableResult);
      return tableResult;
    }
    case 'blockquote':
      return handleBlockquote(node as any, tracker, context, childCompiler);
    case 'thematicBreak':
      return handleThematicBreak(node as any, tracker, context);
    case 'image':
      return handleImage(node as any, tracker, context);
    case 'break':
      return handleBreak(node as any, tracker, context);
    default:
      // Unknown node type — skip silently
      return { insertions: [], styles: [] };
  }
}

function compileChildNodes(
  children: Content[],
  tracker: IndexTracker,
  context: CompilerContext,
  tables: TableCompileResult[],
): HandlerResult {
  const insertions: BatchRequest[] = [];
  const styles: BatchRequest[] = [];

  for (const child of children) {
    const result = compileNode(child, tracker, context, tables);
    insertions.push(...result.insertions);
    styles.push(...result.styles);
  }

  return { insertions, styles };
}

function getStartIndex(request: BatchRequest): number {
  if ('updateTextStyle' in request) return request.updateTextStyle.range.startIndex;
  if ('updateParagraphStyle' in request) return request.updateParagraphStyle.range.startIndex;
  if ('createParagraphBullets' in request) return request.createParagraphBullets.range.startIndex;
  return 0;
}
