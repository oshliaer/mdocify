export function normalize(markdown: string): string {
  let text = markdown;

  // Normalize line endings
  text = text.replace(/\r\n/g, '\n');

  // Trim trailing whitespace per line (Google adds trailing `  `)
  text = text
    .split('\n')
    .map((line) => line.trimEnd())
    .join('\n');

  // Normalize table separator rows to canonical form: |---|---|
  // Must contain at least one dash per cell. Matches: |---|, | :---- |, | :---: |
  text = text.replace(/^\|[:\s-]*-[:\s-]*(?:\|[:\s-]*-[:\s-]*)*\|$/gm, (line) => {
    const cols = line.split('|').slice(1, -1); // remove empty first/last from split
    return '|' + cols.map(() => '---|').join('');
  });

  // Normalize empty table cells: |  | → | |
  // Run twice to handle overlapping matches like |  |  |
  text = text.replace(/\| {2,}(?=\|)/g, '| ');
  text = text.replace(/\| {2,}(?=\|)/g, '| ');

  // Ensure blank line before list starts (Google always adds one)
  text = text.replace(/([^\n])\n([-*+] )/g, '$1\n\n$2');
  text = text.replace(/([^\n])\n(\d+\. )/g, '$1\n\n$2');

  // Collapse multiple blank lines into one
  text = text.replace(/\n{3,}/g, '\n\n');

  // Trim only trailing whitespace
  text = text.trimEnd();

  // Ensure single trailing newline
  text += '\n';

  return text;
}

export function normalizeExported(markdown: string): string {
  let text = markdown;

  // Unescape ALL Google Docs export escaping patterns
  // Order matters: general backslash-char patterns
  text = text.replace(/\\`/g, '`');
  text = text.replace(/\\=/g, '=');
  text = text.replace(/\\_/g, '_');
  text = text.replace(/\\~/g, '~');
  text = text.replace(/\\-/g, '-');
  text = text.replace(/\\\+/g, '+');
  text = text.replace(/\\\./g, '.');
  text = text.replace(/\\#/g, '#');
  text = text.replace(/\\>/g, '>');

  return normalize(text);
}
