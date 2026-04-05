import { describe, it, expect } from 'vitest';
import { normalize } from '../../src/roundtrip/normalize.js';
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

  it('unescapes Google Docs backtick escaping', () => {
    expect(normalize('\\`\\`\\`javascript\ncode\n\\`\\`\\`\n'))
      .toBe('```javascript\ncode\n```\n');
  });

  it('unescapes Google Docs equals escaping', () => {
    expect(normalize('E \\= mc²\n')).toBe('E = mc²\n');
  });

  it('unescapes Google Docs underscore escaping', () => {
    expect(normalize('\\_\\_\\_\n')).toBe('___\n');
  });

  it('handles combined Google escaping + trailing spaces', () => {
    expect(normalize('\\`\\`\\`javascript  \ncode  \n\\`\\`\\`  \n'))
      .toBe('```javascript\ncode\n```\n');
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

  it('detects changed lines', () => {
    const input = '# Hello\n\nWorld\n';
    const exported = '# Hello\n\nEarth\n';
    const losses = diffMarkdown(input, exported);
    expect(losses.length).toBe(1);
    expect(losses[0].line).toBe(3);
    expect(losses[0].original).toBe('World');
    expect(losses[0].exported).toBe('Earth');
  });

  it('detects lost code block fences', () => {
    const input = '```javascript\nconsole.log("hi");\n```\n';
    const exported = 'console.log("hi");\n';
    const losses = diffMarkdown(input, exported);
    expect(losses.length).toBeGreaterThan(0);
  });
});

describe('formatReport', () => {
  it('reports PASS for no losses', () => {
    const report = formatReport([]);
    expect(report).toContain('PASS');
  });

  it('reports FAIL with details', () => {
    const report = formatReport([
      {
        line: 5,
        element: 'code-block',
        original: '```javascript',
        exported: '',
        recommendation: 'Code block fence markers lost.',
      },
    ]);
    expect(report).toContain('FAIL');
    expect(report).toContain('Line 5');
    expect(report).toContain('code-block');
  });
});
