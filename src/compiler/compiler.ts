import type { Root, Node, Content, Table } from 'mdast';
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
  handleBlockquote,
  handleThematicBreak,
  handleImage,
} from './handlers/index.js';
import { extractCellText } from './handlers/table.js';
import * as rb from './request-builder.js';

// --- Phase-based compilation for documents with tables ---

export interface TableData {
  rows: number;
  columns: number;
  cellContents: string[][];
}

export type CompilePhase =
  | { type: 'requests'; requests: BatchRequest[] }
  | { type: 'table'; insertRequest: BatchRequest; table: TableData }
  | { type: 'deferred'; nodes: Content[] };

export interface CompileResult {
  phases: CompilePhase[];
}

export function compile(tree: Root): CompileResult {
  const tracker = new IndexTracker(1);
  const context = createContext();
  const phases: CompilePhase[] = [];

  // Split root children into groups separated by table nodes
  const groups = splitByTables(tree.children);

  let needsDeferred = false;

  for (const group of groups) {
    if (group.type === 'nodes') {
      if (needsDeferred) {
        // After a table — defer compilation until executor provides real cursor
        phases.push({ type: 'deferred', nodes: group.children });
      } else {
        // Before any table — compile normally
        const result = compileChildNodes(group.children, tracker, context);
        const requests = buildRequests(result);
        if (requests.length > 0) {
          phases.push({ type: 'requests', requests });
        }
      }
    } else {
      // Table node
      const tableNode = group.node;
      const rows = tableNode.children.length;
      if (rows === 0) continue;
      const columns = tableNode.children[0]?.children.length ?? 0;
      if (columns === 0) continue;
      const cellContents = tableNode.children.map((row) =>
        row.children.map((cell) => extractCellText(cell)),
      );

      phases.push({
        type: 'table',
        insertRequest: rb.insertTable(rows, columns, needsDeferred ? -1 : tracker.current),
        table: { rows, columns, cellContents },
      });

      needsDeferred = true;
    }
  }

  return { phases };
}

// Compile a set of nodes with a given start index — used by executor after getting real cursor
export function compileNodes(
  nodes: Content[],
  startIndex: number,
): BatchRequest[] {
  const tracker = new IndexTracker(startIndex);
  const context = createContext();
  const result = compileChildNodes(nodes, tracker, context);
  return buildRequests(result);
}

export { IndexTracker };

type NodeGroup =
  | { type: 'nodes'; children: Content[] }
  | { type: 'table'; node: Table };

function splitByTables(children: Content[]): NodeGroup[] {
  const groups: NodeGroup[] = [];
  let currentNodes: Content[] = [];

  for (const child of children) {
    if (child.type === 'table') {
      if (currentNodes.length > 0) {
        groups.push({ type: 'nodes', children: currentNodes });
        currentNodes = [];
      }
      groups.push({ type: 'table', node: child as Table });
    } else {
      currentNodes.push(child);
    }
  }

  if (currentNodes.length > 0) {
    groups.push({ type: 'nodes', children: currentNodes });
  }

  return groups;
}

function buildRequests(result: HandlerResult): BatchRequest[] {
  const styles = result.styles.sort((a, b) => {
    const aIdx = getStartIndex(a);
    const bIdx = getStartIndex(b);
    return bIdx - aIdx;
  });
  return [...result.insertions, ...styles];
}

function compileNode(
  node: Node,
  tracker: IndexTracker,
  context: CompilerContext,
): HandlerResult {
  if (node.type === 'root') {
    return compileChildNodes((node as Root).children, tracker, context);
  }

  const childCompiler = (parent: Node, t: IndexTracker, c: CompilerContext): HandlerResult => {
    if ('children' in parent) {
      return compileChildNodes((parent as any).children, t, c);
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
      return handleList(node as any, tracker, context, childCompiler, compileNode);
    case 'table':
      // Tables handled at root level by splitByTables
      return { insertions: [], styles: [] };
    case 'blockquote':
      return handleBlockquote(node as any, tracker, context, childCompiler);
    case 'thematicBreak':
      return handleThematicBreak(node as any, tracker, context);
    case 'image':
      return handleImage(node as any, tracker, context);
    case 'break':
      return handleBreak(node as any, tracker, context);
    default:
      return { insertions: [], styles: [] };
  }
}

function compileChildNodes(
  children: Content[],
  tracker: IndexTracker,
  context: CompilerContext,
): HandlerResult {
  const insertions: BatchRequest[] = [];
  const styles: BatchRequest[] = [];

  for (const child of children) {
    const result = compileNode(child, tracker, context);
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
