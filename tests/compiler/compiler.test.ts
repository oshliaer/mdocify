import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { parse } from '../../src/parser/parse.js';
import { compile } from '../../src/compiler/compiler.js';

function fixture(name: string): string {
  return readFileSync(resolve(import.meta.dirname, '../../fixtures', name), 'utf-8');
}

describe('compile', () => {
  it('compiles basic headings and paragraphs into a single phase', () => {
    const md = fixture('basic.md');
    const tree = parse(md);
    const result = compile(tree);

    const requestPhases = result.phases.filter((p) => p.type === 'requests');
    expect(requestPhases.length).toBe(1);

    const requests = requestPhases[0].requests;
    expect(requests.length).toBeGreaterThan(0);

    const headingStyles = requests.filter(
      (r) =>
        'updateParagraphStyle' in r &&
        r.updateParagraphStyle.paragraphStyle.namedStyleType?.startsWith('HEADING'),
    );
    expect(headingStyles.length).toBe(3);
  });

  it('splits phases at table boundaries', () => {
    const md = fixture('full.md');
    const tree = parse(md);
    const result = compile(tree);

    const tablePhases = result.phases.filter((p) => p.type === 'table');
    expect(tablePhases.length).toBe(1);
    if (tablePhases[0].type === 'table') {
      expect(tablePhases[0].table.rows).toBeGreaterThan(0);
      expect(tablePhases[0].table.columns).toBeGreaterThan(0);
    }
  });

  it('defers compilation after first table', () => {
    const md = fixture('full.md');
    const tree = parse(md);
    const result = compile(tree);

    const deferredPhases = result.phases.filter((p) => p.type === 'deferred');
    // full.md has content after the table → should have deferred phase
    expect(deferredPhases.length).toBeGreaterThan(0);
  });

  it('styles are sorted in reverse index order within request phases', () => {
    const md = '# First\n\n## Second\n\nParagraph\n';
    const tree = parse(md);
    const result = compile(tree);

    for (const phase of result.phases) {
      if (phase.type !== 'requests') continue;

      const styles = phase.requests.filter(
        (r) => 'updateParagraphStyle' in r || 'updateTextStyle' in r,
      );

      for (let i = 1; i < styles.length; i++) {
        const prevIdx = getStartIndex(styles[i - 1]);
        const currIdx = getStartIndex(styles[i]);
        expect(prevIdx).toBeGreaterThanOrEqual(currIdx);
      }
    }
  });

  it('handles document with many tables (sample_02)', () => {
    const table = '| A | B |\n| - | - |\n| 1 | 2 |\n';
    const md = Array(7).fill(table).join('\n');
    const tree = parse(md);
    const result = compile(tree);

    const tablePhases = result.phases.filter((p) => p.type === 'table');
    expect(tablePhases.length).toBe(7);
  });
});

function getStartIndex(request: any): number {
  if ('updateTextStyle' in request) return request.updateTextStyle.range.startIndex;
  if ('updateParagraphStyle' in request) return request.updateParagraphStyle.range.startIndex;
  if ('createParagraphBullets' in request) return request.createParagraphBullets.range.startIndex;
  return 0;
}
