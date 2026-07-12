import { readFile } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import {
  uploadFile,
  copyAsGoogleDoc,
  exportAsDocx,
  exportAsMarkdown,
  updateWithUpload,
  deleteFile,
  cleanupFiles,
  applyAlignment,
  applyTextStyle,
  applyNamedStyles,
} from './executor/native.js';
import { resolvePreset } from './presets.js';
import { diffMarkdown } from './roundtrip/diff.js';
import { formatReport } from './roundtrip/report.js';
import type { Alignment, ConvertOptions, ConvertResult, LossReport } from './types/options.js';

const ALIGNMENT_MAP: Record<Exclude<Alignment, 'none'>, 'START' | 'CENTER' | 'END' | 'JUSTIFIED'> = {
  start: 'START',
  center: 'CENTER',
  end: 'END',
  justified: 'JUSTIFIED',
};

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
      // Overwrite existing: copy → export docx → update target → cleanup.
      // DOCX preserves bullet lists through the Drive re-import, HTML does not.
      const tempDocId = await copyAsGoogleDoc(mdFileId, `mdocify-temp-${Date.now()}`);
      const docxPath = path.join(os.tmpdir(), `mdocify-${Date.now()}.docx`);

      try {
        await exportAsDocx(tempDocId, docxPath);
        await updateWithUpload(options.documentId, docxPath);
      } finally {
        await deleteFile(tempDocId).catch(() => {});
        await cleanupFiles(docxPath);
      }

      documentId = options.documentId;
    } else {
      // New document: copy with conversion
      documentId = await copyAsGoogleDoc(mdFileId, title);
    }
  } finally {
    await deleteFile(mdFileId).catch(() => {});
  }

  // Resolve preset (if any) and let explicit options win
  const preset = options.preset ? resolvePreset(options.preset) : {};
  const alignment: Alignment = options.alignment ?? preset.alignment ?? 'none';
  const fontFamily = options.fontFamily ?? preset.fontFamily;
  const fontSize = options.fontSize ?? preset.fontSize;
  const namedStyles = options.namedStyles ?? preset.namedStyles;

  if (alignment !== 'none') {
    await applyAlignment(documentId, ALIGNMENT_MAP[alignment]);
  }
  if (namedStyles) {
    await applyNamedStyles(documentId, namedStyles);
  }
  if (fontFamily || fontSize) {
    await applyTextStyle(documentId, { fontFamily, fontSize });
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
