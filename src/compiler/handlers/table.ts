import type { Table, TableRow, TableCell } from 'mdast';
import type { IndexTracker } from '../index-tracker.js';
import type { CompilerContext, HandlerResult } from './index.js';
import type { BatchRequest } from '../../types/google-docs.js';
import * as rb from '../request-builder.js';

export interface TableCompileResult extends HandlerResult {
  needsSecondPhase: boolean;
  tableIndex: number;
  rows: number;
  columns: number;
  cellContents: string[][];
}

export function handleTable(
  node: Table,
  tracker: IndexTracker,
  _context: CompilerContext,
): TableCompileResult {
  const rows = node.children.length;
  const columns = node.children[0]?.children.length ?? 0;
  const tableIndex = tracker.current;

  const cellContents: string[][] = [];
  for (const row of node.children as TableRow[]) {
    const rowContents: string[] = [];
    for (const cell of row.children as TableCell[]) {
      const text = extractCellText(cell);
      rowContents.push(text);
    }
    cellContents.push(rowContents);
  }

  // Table insertion shifts the cursor significantly.
  // The exact amount depends on Google Docs internal structure.
  // We mark this as needing a second phase - the executor will:
  // 1. Insert the table
  // 2. Get the document to find cell indices
  // 3. Fill cells in a second batchUpdate
  const insertions: BatchRequest[] = [rb.insertTable(rows, columns, tableIndex)];

  // Estimate: each table takes approximately (rows * cols * 4 + rows * 2 + 4) indices
  const estimatedSize = rows * columns * 4 + rows * 2 + 4;
  tracker.advance(estimatedSize);

  // Add trailing newline
  const newline = tracker.insert('\n');
  insertions.push(rb.insertText('\n', newline.startIndex));

  return {
    insertions,
    styles: [],
    needsSecondPhase: true,
    tableIndex,
    rows,
    columns,
    cellContents,
  };
}

function extractCellText(cell: TableCell): string {
  const parts: string[] = [];
  for (const child of cell.children) {
    if (child.type === 'text') {
      parts.push(child.value);
    } else if ('children' in child) {
      for (const sub of (child as any).children) {
        if (sub.type === 'text') {
          parts.push(sub.value);
        }
      }
    }
  }
  return parts.join('');
}
