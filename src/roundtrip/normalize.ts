export function normalize(markdown: string): string {
  let text = markdown;

  // Normalize line endings
  text = text.replace(/\r\n/g, '\n');

  // Trim trailing whitespace per line
  text = text
    .split('\n')
    .map((line) => line.trimEnd())
    .join('\n');

  // Collapse multiple blank lines into one
  text = text.replace(/\n{3,}/g, '\n\n');

  // Trim leading/trailing whitespace
  text = text.trim();

  // Ensure single trailing newline
  text += '\n';

  return text;
}
