export function normalize(markdown: string): string {
  let text = markdown;

  // Normalize line endings
  text = text.replace(/\r\n/g, '\n');

  // Trim trailing whitespace per line (Google adds trailing `  `)
  text = text
    .split('\n')
    .map((line) => line.trimEnd())
    .join('\n');

  // Collapse multiple blank lines into one
  text = text.replace(/\n{3,}/g, '\n\n');

  // Trim only trailing whitespace (preserve leading whitespace for indented code blocks)
  text = text.trimEnd();

  // Ensure single trailing newline
  text += '\n';

  return text;
}

export function normalizeExported(markdown: string): string {
  let text = markdown;

  // Unescape Google Docs export escaping (\` → `, \= → =, \_ → _)
  text = text.replace(/\\`/g, '`');
  text = text.replace(/\\=/g, '=');
  text = text.replace(/\\_/g, '_');

  return normalize(text);
}
