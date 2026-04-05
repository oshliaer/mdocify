import type { BatchRequest } from '../types/google-docs.js';

const MAX_REQUESTS_PER_BATCH = 1000;

function isInsertionRequest(req: BatchRequest): boolean {
  return 'insertText' in req || 'insertTable' in req || 'insertInlineImage' in req || 'insertSectionBreak' in req;
}

export function chunkRequests(requests: BatchRequest[]): BatchRequest[][] {
  // Split into insertions and styles to preserve the two-pass design:
  // all insertions must execute before any styles, even across chunks.
  const insertions = requests.filter(isInsertionRequest);
  const styles = requests.filter((r) => !isInsertionRequest(r));

  const chunks: BatchRequest[][] = [];

  for (let i = 0; i < insertions.length; i += MAX_REQUESTS_PER_BATCH) {
    chunks.push(insertions.slice(i, i + MAX_REQUESTS_PER_BATCH));
  }

  for (let i = 0; i < styles.length; i += MAX_REQUESTS_PER_BATCH) {
    chunks.push(styles.slice(i, i + MAX_REQUESTS_PER_BATCH));
  }

  return chunks.length > 0 ? chunks : [[]];
}
