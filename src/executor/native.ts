import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { unlink } from 'node:fs/promises';

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

async function getBodyEndIndex(documentId: string): Promise<number> {
  const raw = await gws(
    'docs', 'documents', 'get',
    '--params', JSON.stringify({ documentId }),
  );
  const doc = parseResponse(raw);
  const content = doc?.body?.content ?? [];
  const last = content[content.length - 1];
  return last?.endIndex ?? 1;
}

export async function applyAlignment(documentId: string, alignment: Alignment): Promise<void> {
  const end = await getBodyEndIndex(documentId);
  if (end <= 1) return;

  const body = {
    requests: [
      {
        updateParagraphStyle: {
          range: { startIndex: 1, endIndex: end - 1 },
          paragraphStyle: { alignment },
          fields: 'alignment',
        },
      },
    ],
  };

  const raw = await gws(
    'docs', 'documents', 'batchUpdate',
    '--params', JSON.stringify({ documentId }),
    '--json', JSON.stringify(body),
  );
  parseResponse(raw);
}

export interface TextStyleOptions {
  fontFamily?: string;
  fontSize?: number;
}

export type NamedStyleMap = Partial<Record<string, TextStyleOptions>>;

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

export async function applyNamedStyles(documentId: string, map: NamedStyleMap): Promise<void> {
  const raw = await gws(
    'docs', 'documents', 'get',
    '--params', JSON.stringify({ documentId }),
  );
  const doc = parseResponse(raw);
  const paragraphs = collectParagraphRanges(doc?.body?.content ?? []);

  const requests: unknown[] = [];
  for (const p of paragraphs) {
    const style = map[p.namedStyleType];
    if (!style) continue;
    // For heading-style paragraphs the trailing newline can carry run style from the
    // next paragraph. Trim endIndex by 1 when the range is longer than one char.
    const end = p.end - p.start > 1 ? p.end - 1 : p.end;
    const req = buildTextStyleRequest(style, p.start, end);
    if (req) requests.push(req);
  }
  if (requests.length === 0) return;

  const body = { requests };
  const raw2 = await gws(
    'docs', 'documents', 'batchUpdate',
    '--params', JSON.stringify({ documentId }),
    '--json', JSON.stringify(body),
  );
  parseResponse(raw2);
}

export async function applyTextStyle(documentId: string, style: TextStyleOptions): Promise<void> {
  const end = await getBodyEndIndex(documentId);
  if (end <= 1) return;

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

  if (fields.length === 0) return;

  const body = {
    requests: [
      {
        updateTextStyle: {
          range: { startIndex: 1, endIndex: end - 1 },
          textStyle,
          fields: fields.join(','),
        },
      },
    ],
  };

  const raw = await gws(
    'docs', 'documents', 'batchUpdate',
    '--params', JSON.stringify({ documentId }),
    '--json', JSON.stringify(body),
  );
  parseResponse(raw);
}
