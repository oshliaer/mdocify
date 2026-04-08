import { describe, it, expect, afterAll } from 'vitest';
import { convert } from '../../src/index.js';
import { deleteFile } from '../../src/executor/native.js';
import { resolve } from 'node:path';

const createdDocs: string[] = [];

afterAll(async () => {
  for (const docId of createdDocs) {
    try { await deleteFile(docId); } catch { /* cleanup best-effort */ }
  }
});

describe('e2e: convert', () => {
  it('creates new document from basic.md', async () => {
    const result = await convert(resolve(import.meta.dirname, '../../fixtures/basic.md'));
    createdDocs.push(result.documentId);

    expect(result.documentId).toBeTruthy();
    expect(result.url).toContain('docs.google.com');
    expect(result.url).toContain(result.documentId);
  }, 60_000);

  it('creates new document from full.md (with table)', async () => {
    const result = await convert(resolve(import.meta.dirname, '../../fixtures/full.md'));
    createdDocs.push(result.documentId);

    expect(result.documentId).toBeTruthy();
  }, 60_000);

  it('creates new document with custom title', async () => {
    const result = await convert(
      resolve(import.meta.dirname, '../../fixtures/basic.md'),
      { title: 'mdocify-e2e-custom-title' },
    );
    createdDocs.push(result.documentId);

    expect(result.title).toBe('mdocify-e2e-custom-title');
  }, 60_000);

  it('overwrites existing document preserving ID', async () => {
    // Create initial doc
    const initial = await convert(resolve(import.meta.dirname, '../../fixtures/basic.md'));
    createdDocs.push(initial.documentId);

    // Overwrite with different content
    const result = await convert(
      resolve(import.meta.dirname, '../../fixtures/full.md'),
      { documentId: initial.documentId },
    );

    expect(result.documentId).toBe(initial.documentId);
    expect(result.url).toContain(initial.documentId);
  }, 120_000);

  it('round-trip basic.md passes verification', async () => {
    const result = await convert(
      resolve(import.meta.dirname, '../../fixtures/basic.md'),
      { verify: true },
    );
    createdDocs.push(result.documentId);

    expect(result.losses.length).toBe(0);
  }, 60_000);

  it('round-trip full.md reports differences', async () => {
    const result = await convert(
      resolve(import.meta.dirname, '../../fixtures/full.md'),
      { verify: true },
    );
    createdDocs.push(result.documentId);

    // Complex doc may have some losses but should be manageable
    expect(result.losses.length).toBeLessThan(50);
  }, 120_000);

  it('round-trip branching-rules.md creates document', async () => {
    const result = await convert(
      resolve(import.meta.dirname, '../../fixtures/branching-rules.md'),
      { verify: true },
    );
    createdDocs.push(result.documentId);

    // Document should be created successfully
    expect(result.documentId).toBeTruthy();
    // Complex doc with code blocks, checklists, tables — will have some losses
    // but should be manageable (checklist items convert to checkboxes and back differently)
    expect(result.losses.length).toBeLessThan(150);
  }, 120_000);
});
