import { readFile } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import {
  uploadFile,
  copyAsGoogleDoc,
  exportAsHtml,
  exportAsMarkdown,
  updateWithUpload,
  deleteFile,
  cleanupFiles,
} from './executor/native.js';
import { diffMarkdown } from './roundtrip/diff.js';
import { formatReport } from './roundtrip/report.js';
import type { ConvertOptions, ConvertResult, LossReport } from './types/options.js';

export async function convert(
  markdownPath: string,
  options: ConvertOptions = {},
): Promise<ConvertResult> {
  const markdown = await readFile(markdownPath, 'utf-8');
  const title = options.title ?? path.basename(markdownPath, '.md');
  let documentId: string;

  // Upload md to Google Drive
  const mdFileId = await uploadFile(markdownPath, `mdocify-temp-${Date.now()}.md`);

  try {
    if (options.documentId) {
      // Overwrite existing: copy → export html → update target → cleanup
      const tempDocId = await copyAsGoogleDoc(mdFileId, `mdocify-temp-${Date.now()}`);
      const htmlPath = path.join(os.tmpdir(), `mdocify-${Date.now()}.html`);

      try {
        await exportAsHtml(tempDocId, htmlPath);
        await updateWithUpload(options.documentId, htmlPath);
      } finally {
        await deleteFile(tempDocId).catch(() => {});
        await cleanupFiles(htmlPath);
      }

      documentId = options.documentId;
    } else {
      // New document: copy with conversion
      documentId = await copyAsGoogleDoc(mdFileId, title);
    }
  } finally {
    await deleteFile(mdFileId).catch(() => {});
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

export { diffMarkdown } from './roundtrip/diff.js';
export { normalize, normalizeExported } from './roundtrip/normalize.js';
export { formatReport } from './roundtrip/report.js';
export type { ConvertOptions, ConvertResult, LossReport } from './types/options.js';
