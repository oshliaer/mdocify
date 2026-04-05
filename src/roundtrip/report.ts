import type { LossReport } from '../types/options.js';

export function formatReport(losses: LossReport[]): string {
  if (losses.length === 0) {
    return 'Round-trip verification: PASS (no losses detected)';
  }

  const lines: string[] = [
    `Round-trip verification: FAIL (${losses.length} difference${losses.length > 1 ? 's' : ''} found)`,
    '',
  ];

  for (const loss of losses) {
    lines.push(`Line ${loss.line} [${loss.element}]:`);
    lines.push(`  - input:    ${loss.original || '(empty)'}`);
    lines.push(`  + exported: ${loss.exported || '(empty)'}`);
    lines.push(`  → ${loss.recommendation}`);
    lines.push('');
  }

  return lines.join('\n');
}
