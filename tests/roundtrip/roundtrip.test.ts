import { describe, it, expect } from 'vitest';
import { normalize, normalizeExported } from '../../src/roundtrip/normalize.js';
import { diffMarkdown } from '../../src/roundtrip/diff.js';
import { formatReport } from '../../src/roundtrip/report.js';

describe('normalize', () => {
  it('normalizes line endings', () => {
    expect(normalize('a\r\nb\r\n')).toBe('a\nb\n');
  });

  it('trims trailing whitespace per line', () => {
    expect(normalize('hello   \nworld  \n')).toBe('hello\nworld\n');
  });

  it('collapses multiple blank lines', () => {
    expect(normalize('a\n\n\n\nb\n')).toBe('a\n\nb\n');
  });

  it('ensures single trailing newline', () => {
    expect(normalize('hello')).toBe('hello\n');
    expect(normalize('hello\n\n\n')).toBe('hello\n');
  });

  it('does NOT unescape Google escaping (input normalization)', () => {
    expect(normalize('\\`\\`\\`javascript\n')).toBe('\\`\\`\\`javascript\n');
  });

  it('normalizes table separator rows', () => {
    expect(normalize('| :---- | :---- |\n')).toBe('|---|---|\n');
    expect(normalize('| :---: | :---: |\n')).toBe('|---|---|\n');
    expect(normalize('|---|---|\n')).toBe('|---|---|\n');
  });

  it('normalizes empty table cells', () => {
    expect(normalize('|  |  |\n')).toBe('| | |\n');
  });

  it('adds blank line before lists', () => {
    expect(normalize('text\n- item\n')).toBe('text\n\n- item\n');
    expect(normalize('text\n1. item\n')).toBe('text\n\n1. item\n');
  });

  it('does not double blank line if already present', () => {
    expect(normalize('text\n\n- item\n')).toBe('text\n\n- item\n');
  });
});

describe('normalizeExported', () => {
  it('unescapes Google Docs backtick escaping', () => {
    expect(normalizeExported('\\`\\`\\`javascript\ncode\n\\`\\`\\`\n'))
      .toBe('```javascript\ncode\n```\n');
  });

  it('unescapes Google Docs equals escaping', () => {
    expect(normalizeExported('E \\= mc²\n')).toBe('E = mc²\n');
  });

  it('unescapes Google Docs underscore escaping', () => {
    expect(normalizeExported('\\_\\_\\_\n')).toBe('___\n');
  });

  it('unescapes tilde', () => {
    expect(normalizeExported('\\~100\n')).toBe('~100\n');
  });

  it('unescapes dash', () => {
    expect(normalizeExported('\\--\n')).toBe('--\n');
  });

  it('unescapes plus', () => {
    expect(normalizeExported('Б \\+ В\n')).toBe('Б + В\n');
  });

  it('unescapes dot', () => {
    expect(normalizeExported('1\\. Пункт\n')).toBe('1. Пункт\n');
  });

  it('unescapes hash', () => {
    expect(normalizeExported('\\# heading\n')).toBe('# heading\n');
  });

  it('unescapes greater-than', () => {
    expect(normalizeExported('\\>10%\n')).toBe('>10%\n');
  });

  it('handles combined escaping + trailing spaces', () => {
    expect(normalizeExported('\\`\\`\\`sql  \ncode  \n\\`\\`\\`  \n'))
      .toBe('```sql\ncode\n```\n');
  });
});

describe('diffMarkdown', () => {
  it('returns empty array for identical content', () => {
    const md = '# Hello\n\nWorld\n';
    expect(diffMarkdown(md, md)).toEqual([]);
  });

  it('returns empty for content differing only in whitespace', () => {
    const input = '# Hello  \n\nWorld\n';
    const exported = '# Hello\n\nWorld\n';
    expect(diffMarkdown(input, exported)).toEqual([]);
  });

  it('returns empty when export only has Google escaping', () => {
    const input = '## 1. Heading\n';
    const exported = '## 1\\. Heading\n';
    expect(diffMarkdown(input, exported)).toEqual([]);
  });

  it('detects changed lines', () => {
    const input = '# Hello\n\nWorld\n';
    const exported = '# Hello\n\nEarth\n';
    const losses = diffMarkdown(input, exported);
    expect(losses.length).toBe(1);
    expect(losses[0].line).toBe(3);
  });

  it('handles table separator normalization', () => {
    const input = '| A | B |\n|---|---|\n| 1 | 2 |\n';
    const exported = '| A | B |\n| :---- | :---- |\n| 1 | 2 |\n';
    expect(diffMarkdown(input, exported)).toEqual([]);
  });
});

describe('formatReport', () => {
  it('reports PASS for no losses', () => {
    expect(formatReport([])).toContain('PASS');
  });

  it('reports FAIL with details', () => {
    const report = formatReport([{
      line: 5, element: 'code-block',
      original: '```javascript', exported: '',
      recommendation: 'Code block fence markers lost.',
    }]);
    expect(report).toContain('FAIL');
    expect(report).toContain('Line 5');
  });
});
