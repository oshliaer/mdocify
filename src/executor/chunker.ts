import type { BatchRequest } from '../types/google-docs.js';

const MAX_REQUESTS_PER_BATCH = 1000;

export function chunkRequests(requests: BatchRequest[]): BatchRequest[][] {
  if (requests.length <= MAX_REQUESTS_PER_BATCH) {
    return [requests];
  }

  const chunks: BatchRequest[][] = [];
  for (let i = 0; i < requests.length; i += MAX_REQUESTS_PER_BATCH) {
    chunks.push(requests.slice(i, i + MAX_REQUESTS_PER_BATCH));
  }
  return chunks;
}
