import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import type { BatchRequest } from '../types/google-docs.js';
import { chunkRequests } from './chunker.js';

const exec = promisify(execFile);

async function gws(...args: string[]): Promise<string> {
  try {
    const { stdout } = await exec('gws', args, {
      maxBuffer: 50 * 1024 * 1024,
    });
    return stdout;
  } catch (err: any) {
    // gws may exit non-zero on retries but still produce valid output
    if (err.stdout && err.stdout.trim().startsWith('{')) {
      return err.stdout;
    }
    throw err;
  }
}

export async function createDocument(title: string): Promise<{ documentId: string }> {
  const result = await gws(
    'docs', 'documents', 'create',
    '--json', JSON.stringify({ title }),
  );
  return JSON.parse(result);
}

export async function batchUpdate(
  documentId: string,
  requests: BatchRequest[],
): Promise<void> {
  const chunks = chunkRequests(requests);

  for (const chunk of chunks) {
    await gws(
      'docs', 'documents', 'batchUpdate',
      '--params', JSON.stringify({ documentId }),
      '--json', JSON.stringify({ requests: chunk }),
    );
  }
}

export async function getDocument(documentId: string): Promise<any> {
  const result = await gws(
    'docs', 'documents', 'get',
    '--params', JSON.stringify({ documentId }),
  );
  const doc = JSON.parse(result);
  if (doc.error) {
    throw new Error(`gws docs get error: ${doc.error.message ?? JSON.stringify(doc.error)}`);
  }
  return doc;
}

export async function exportAsMarkdown(
  fileId: string,
  outputPath: string,
): Promise<void> {
  await gws(
    'drive', 'files', 'export',
    '--params', JSON.stringify({ fileId, mimeType: 'text/markdown' }),
    '-o', outputPath,
  );
}

export async function deleteFile(fileId: string): Promise<void> {
  await gws(
    'drive', 'files', 'delete',
    '--params', JSON.stringify({ fileId }),
  );
}

export async function fillTableCells(
  documentId: string,
  rows: number,
  columns: number,
  cellContents: string[][],
): Promise<void> {
  // Get document to find the last table's cell indices
  const doc = await getDocument(documentId);
  const body = doc.body?.content;
  if (!body) {
    throw new Error(`Document ${documentId} did not include body content`);
  }

  // Find the last table element (the one we just inserted)
  const tableElements = body.filter((el: any) => el.table);
  const tableElement = tableElements[tableElements.length - 1];
  if (!tableElement?.table) {
    throw new Error(`No table found in document ${documentId}`);
  }

  const requests: BatchRequest[] = [];

  // Fill cells in reverse order to avoid index shifts
  for (let r = rows - 1; r >= 0; r--) {
    const row = tableElement.table.tableRows?.[r];
    if (!row) continue;

    for (let c = columns - 1; c >= 0; c--) {
      const cell = row.tableCells?.[c];
      if (!cell) continue;

      const text = cellContents[r]?.[c];
      if (!text) continue;

      const cellContent = cell.content?.[0];
      if (!cellContent) continue;

      const insertIndex = cellContent.startIndex;
      requests.push({
        insertText: {
          text,
          location: { index: insertIndex },
        },
      });
    }
  }

  if (requests.length > 0) {
    await batchUpdate(documentId, requests);
  }
}

export function getDocumentEndIndex(doc: any): number {
  const body = doc.body?.content;
  if (!body || body.length === 0) return 1;
  const lastElement = body[body.length - 1];
  return lastElement.endIndex ?? 1;
}
