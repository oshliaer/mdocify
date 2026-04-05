import type { LossReport } from '../types/options.js';
import { normalize } from './normalize.js';

export function diffMarkdown(
  input: string,
  exported: string,
): LossReport[] {
  const normalizedInput = normalize(input);
  const normalizedExported = normalize(exported);

  if (normalizedInput === normalizedExported) {
    return [];
  }

  const inputLines = normalizedInput.split('\n');
  const exportedLines = normalizedExported.split('\n');
  const losses: LossReport[] = [];

  const maxLines = Math.max(inputLines.length, exportedLines.length);

  for (let i = 0; i < maxLines; i++) {
    const inputLine = inputLines[i] ?? '';
    const exportedLine = exportedLines[i] ?? '';

    if (inputLine !== exportedLine) {
      losses.push({
        line: i + 1,
        element: detectElement(inputLine),
        original: inputLine,
        exported: exportedLine,
        recommendation: suggestFix(inputLine, exportedLine),
      });
    }
  }

  return losses;
}

function detectElement(line: string): string {
  if (/^#{1,6}\s/.test(line)) return 'heading';
  if (/^```/.test(line)) return 'code-block';
  if (/^\|/.test(line)) return 'table';
  if (/^[-*+]\s/.test(line)) return 'unordered-list';
  if (/^\d+\.\s/.test(line)) return 'ordered-list';
  if (/^>/.test(line)) return 'blockquote';
  if (/^---$|^\*\*\*$|^___$|^─{3,}$/.test(line)) return 'thematic-break';
  if (/!\[/.test(line)) return 'image';
  if (/\[.*?\]\(.*?\)/.test(line)) return 'link';
  if (/`[^`]+`/.test(line)) return 'inline-code';
  if (/\*\*[^*]+\*\*/.test(line)) return 'bold';
  if (/\*[^*]+\*/.test(line)) return 'italic';
  if (/~~[^~]+~~/.test(line)) return 'strikethrough';
  return 'text';
}

function suggestFix(input: string, exported: string): string {
  if (exported === '') return 'This element was lost during export. Consider simplifying.';
  if (input.includes('```') && !exported.includes('```')) {
    return 'Code block fence markers lost. Google Docs may not preserve language tags.';
  }
  if (input.includes('$$') || input.includes('\\(')) {
    return 'Math formula may not survive round-trip. Consider using plain text notation.';
  }
  return 'Element was modified during export. Use the exported version as canonical.';
}
