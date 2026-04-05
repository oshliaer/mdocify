import { readFile } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { parse } from './parser/parse.js';
import { compile } from './compiler/compiler.js';
import {
  createDocument,
  getDocument,
  batchUpdate,
  exportAsMarkdown,
  fillTableCells,
} from './executor/executor.js';
import { diffMarkdown } from './roundtrip/diff.js';
import { formatReport } from './roundtrip/report.js';
import type { ConvertOptions, ConvertResult, LossReport } from './types/options.js';

export async function convert(
  markdownPath: string,
  options: ConvertOptions = {},
): Promise<ConvertResult> {
  const markdown = await readFile(markdownPath, 'utf-8');
  const tree = parse(markdown);
  const { requests, tables } = compile(tree);

  // Create or use existing document
  const title = options.title ?? path.basename(markdownPath, '.md');
  let documentId: string;

  if (options.documentId) {
    documentId = options.documentId;
    // Clear existing content before inserting new
    const existingDoc = await getDocument(documentId);
    const bodyContent = existingDoc.body?.content;
    if (bodyContent && bodyContent.length > 1) {
      const lastElement = bodyContent[bodyContent.length - 1];
      const endIndex = lastElement.endIndex - 1; // preserve trailing newline
      if (endIndex > 1) {
        await batchUpdate(documentId, [{
          deleteContentRange: { range: { startIndex: 1, endIndex } },
        }]);
      }
    }
  } else {
    const doc = await createDocument(title);
    documentId = doc.documentId;
  }

  // Send main batch requests
  if (requests.length > 0) {
    await batchUpdate(documentId, requests);
  }

  // Fill table cells (second phase)
  for (const table of tables) {
    if (table.needsSecondPhase) {
      await fillTableCells(
        documentId,
        table.tableIndex,
        table.rows,
        table.columns,
        table.cellContents,
      );
    }
  }

  const url = `https://docs.google.com/document/d/${documentId}/edit`;
  let losses: LossReport[] = [];

  // Round-trip verification
  if (options.verify) {
    const exportPath = options.output ?? path.join(os.tmpdir(), `mdocify-export-${documentId}.md`);
    await exportAsMarkdown(documentId, exportPath);
    const exported = await readFile(exportPath, 'utf-8');
    losses = diffMarkdown(markdown, exported);

    if (losses.length > 0) {
      console.error(formatReport(losses));
    } else {
      console.log(formatReport(losses));
    }
  }

  return { documentId, title, url, losses };
}

export { parse } from './parser/parse.js';
export { compile } from './compiler/compiler.js';
export { diffMarkdown } from './roundtrip/diff.js';
export { normalize, normalizeExported } from './roundtrip/normalize.js';
export { formatReport } from './roundtrip/report.js';
export type { ConvertOptions, ConvertResult, LossReport } from './types/options.js';
export type { CompileResult } from './compiler/compiler.js';
export type { BatchRequest } from './types/google-docs.js';
