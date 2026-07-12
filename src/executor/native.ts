import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { unlink } from 'node:fs/promises';
import { MAX_REQUESTS_PER_BATCH } from './chunker.js';

const exec = promisify(execFile);

async function gws(...args: string[]): Promise<string> {
  try {
    const { stdout } = await exec('gws', args, {
      maxBuffer: 50 * 1024 * 1024,
    });
    return stdout;
  } catch (err: any) {
    if (err.stdout && err.stdout.trim().startsWith('{')) {
      return err.stdout;
    }
    throw err;
  }
}

function parseResponse(raw: string): any {
  const parsed = JSON.parse(raw);
  if (parsed.error) {
    throw new Error(`gws error: ${parsed.error.message ?? JSON.stringify(parsed.error)}`);
  }
  return parsed;
}

export async function uploadFile(localPath: string, name?: string): Promise<string> {
  const json = name ? JSON.stringify({ name }) : '{}';
  const result = await gws(
    'drive', 'files', 'create',
    '--upload', localPath,
    '--json', json,
  );
  const parsed = parseResponse(result);
  return parsed.id;
}

export async function copyAsGoogleDoc(fileId: string, title?: string): Promise<string> {
  const body: Record<string, string> = {
    mimeType: 'application/vnd.google-apps.document',
  };
  if (title) body.name = title;

  const result = await gws(
    'drive', 'files', 'copy',
    '--params', JSON.stringify({ fileId }),
    '--json', JSON.stringify(body),
  );
  const parsed = parseResponse(result);
  return parsed.id;
}

export async function exportAsHtml(fileId: string, outputPath: string): Promise<void> {
  await gws(
    'drive', 'files', 'export',
    '--params', JSON.stringify({ fileId, mimeType: 'text/html' }),
    '-o', outputPath,
  );
}

export async function exportAsDocx(fileId: string, outputPath: string): Promise<void> {
  await gws(
    'drive', 'files', 'export',
    '--params', JSON.stringify({
      fileId,
      mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    }),
    '-o', outputPath,
  );
}

export async function exportAsMarkdown(fileId: string, outputPath: string): Promise<void> {
  await gws(
    'drive', 'files', 'export',
    '--params', JSON.stringify({ fileId, mimeType: 'text/markdown' }),
    '-o', outputPath,
  );
}

export async function updateWithUpload(fileId: string, localPath: string): Promise<void> {
  const result = await gws(
    'drive', 'files', 'update',
    '--params', JSON.stringify({ fileId }),
    '--upload', localPath,
  );
  parseResponse(result);
}

export async function deleteFile(fileId: string): Promise<void> {
  const result = await gws(
    'drive', 'files', 'delete',
    '--params', JSON.stringify({ fileId }),
  );
  parseResponse(result);
}

export async function cleanupFiles(...paths: string[]): Promise<void> {
  for (const p of paths) {
    try { await unlink(p); } catch { /* ignore */ }
  }
}

export type Alignment = 'START' | 'CENTER' | 'END' | 'JUSTIFIED';

export interface TextStyleOptions {
  fontFamily?: string;
  fontSize?: number;
}

export type NamedStyleMap = Partial<Record<string, TextStyleOptions>>;

export interface FormattingOptions {
  alignment?: Alignment;
  namedStyles?: NamedStyleMap;
  textStyle?: TextStyleOptions;
}

interface ParagraphRange {
  start: number;
  end: number;
  namedStyleType: string;
}

function collectParagraphRanges(content: unknown[]): ParagraphRange[] {
  const out: ParagraphRange[] = [];
  const walk = (elems: unknown[]): void => {
    for (const e of elems as any[]) {
      if (e?.paragraph) {
        // A structural element without numeric indices can't yield a valid range —
        // skip it so no NaN reaches later arithmetic or request construction.
        if (typeof e.startIndex !== 'number' || typeof e.endIndex !== 'number') continue;
        const nst = e.paragraph.paragraphStyle?.namedStyleType ?? 'NORMAL_TEXT';
        out.push({ start: e.startIndex, end: e.endIndex, namedStyleType: nst });
      } else if (e?.table) {
        for (const row of e.table.tableRows ?? []) {
          for (const cell of row.tableCells ?? []) {
            walk(cell.content ?? []);
          }
        }
      }
    }
  };
  walk(content);
  return out;
}

function buildTextStyleRequest(style: TextStyleOptions, start: number, end: number): unknown | null {
  if (start >= end) return null;
  const textStyle: Record<string, unknown> = {};
  const fields: string[] = [];
  if (style.fontFamily) {
    textStyle.weightedFontFamily = { fontFamily: style.fontFamily };
    fields.push('weightedFontFamily');
  }
  if (style.fontSize) {
    textStyle.fontSize = { magnitude: style.fontSize, unit: 'PT' };
    fields.push('fontSize');
  }
  if (fields.length === 0) return null;
  return {
    updateTextStyle: {
      range: { startIndex: start, endIndex: end },
      textStyle,
      fields: fields.join(','),
    },
  };
}

/**
 * Apply alignment, per-namedStyle text overrides and a document-wide text style
 * in a single pass: one `documents.get` to resolve ranges, one `batchUpdate` to
 * apply every request. Requests are ordered alignment → namedStyles → textStyle,
 * so an explicit document-wide `textStyle` wins over `namedStyles` on overlap
 * (last write in a batchUpdate takes precedence).
 */
export async function applyFormatting(documentId: string, opts: FormattingOptions): Promise<void> {
  const raw = await gws(
    'docs', 'documents', 'get',
    '--params', JSON.stringify({ documentId }),
  );
  const doc = parseResponse(raw);
  const content = doc?.body?.content ?? [];
  const last = content[content.length - 1];
  const end = last?.endIndex ?? 1;

  const requests: unknown[] = [];

  if (opts.alignment && end > 2) {
    requests.push({
      updateParagraphStyle: {
        range: { startIndex: 1, endIndex: end - 1 },
        paragraphStyle: { alignment: opts.alignment },
        fields: 'alignment',
      },
    });
  }

  if (opts.namedStyles) {
    for (const p of collectParagraphRanges(content)) {
      const style = opts.namedStyles[p.namedStyleType];
      if (!style) continue;
      // For heading-style paragraphs the trailing newline can carry run style from the
      // next paragraph. Trim endIndex by 1 when the range is longer than one char.
      const pEnd = p.end - p.start > 1 ? p.end - 1 : p.end;
      const req = buildTextStyleRequest(style, p.start, pEnd);
      if (req) requests.push(req);
    }
  }

  if (opts.textStyle && end > 2) {
    const req = buildTextStyleRequest(opts.textStyle, 1, end - 1);
    if (req) requests.push(req);
  }

  if (requests.length === 0) return;

  // A large document can yield one updateTextStyle per paragraph, which may exceed
  // the Docs batchUpdate request limit. Split into ordered chunks. All requests here
  // are style updates (no insertions), so sequential chunks preserve precedence —
  // the document-wide textStyle, pushed last, still lands in the final chunk.
  for (let i = 0; i < requests.length; i += MAX_REQUESTS_PER_BATCH) {
    const chunk = requests.slice(i, i + MAX_REQUESTS_PER_BATCH);
    const raw2 = await gws(
      'docs', 'documents', 'batchUpdate',
      '--params', JSON.stringify({ documentId }),
      '--json', JSON.stringify({ requests: chunk }),
    );
    parseResponse(raw2);
  }
}
