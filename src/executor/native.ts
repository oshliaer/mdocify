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
  await gws(
    'drive', 'files', 'delete',
    '--params', JSON.stringify({ fileId }),
  );
}

export async function cleanupFiles(...paths: string[]): Promise<void> {
  for (const p of paths) {
    try { await unlink(p); } catch { /* ignore */ }
  }
}
