import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { parse } from '../../src/parser/parse.js';
import { compile } from '../../src/compiler/compiler.js';

function fixture(name: string): string {
  return readFileSync(resolve(import.meta.dirname, '../../fixtures', name), 'utf-8');
}

describe('compile', () => {
  it('compiles basic headings and paragraphs', () => {
    const md = fixture('basic.md');
    const tree = parse(md);
    const result = compile(tree);

    expect(result.requests.length).toBeGreaterThan(0);

    // Should have insertText requests
    const insertions = result.requests.filter((r) => 'insertText' in r);
    expect(insertions.length).toBeGreaterThan(0);

    // Should have heading style requests
    const headingStyles = result.requests.filter(
      (r) =>
        'updateParagraphStyle' in r &&
        r.updateParagraphStyle.paragraphStyle.namedStyleType?.startsWith('HEADING'),
    );
    expect(headingStyles.length).toBe(3); // H1, H2, H3
  });

  it('compiles full document without throwing', () => {
    const md = fixture('full.md');
    const tree = parse(md);
    const result = compile(tree);

    expect(result.requests.length).toBeGreaterThan(0);
    // Full doc has a table
    expect(result.tables.length).toBe(1);
  });

  it('styles are sorted in reverse index order', () => {
    const md = '# First\n\n## Second\n\nParagraph\n';
    const tree = parse(md);
    const result = compile(tree);

    const styles = result.requests.filter(
      (r) => 'updateParagraphStyle' in r || 'updateTextStyle' in r,
    );

    for (let i = 1; i < styles.length; i++) {
      const prevIdx = getStartIndex(styles[i - 1]);
      const currIdx = getStartIndex(styles[i]);
      expect(prevIdx).toBeGreaterThanOrEqual(currIdx);
    }
  });
});

function getStartIndex(request: any): number {
  if ('updateTextStyle' in request) return request.updateTextStyle.range.startIndex;
  if ('updateParagraphStyle' in request) return request.updateParagraphStyle.range.startIndex;
  if ('createParagraphBullets' in request) return request.createParagraphBullets.range.startIndex;
  return 0;
}
