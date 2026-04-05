import type {
  InsertTextRequest,
  UpdateTextStyleRequest,
  UpdateParagraphStyleRequest,
  CreateParagraphBulletsRequest,
  InsertTableRequest,
  InsertInlineImageRequest,
  TextStyle,
  ParagraphStyle,
  Range,
} from '../types/google-docs.js';

export function insertText(text: string, index: number): InsertTextRequest {
  return {
    insertText: {
      text,
      location: { index },
    },
  };
}

export function insertTextAtEnd(text: string): InsertTextRequest {
  return {
    insertText: {
      text,
      endOfSegmentLocation: { segmentId: '' },
    },
  };
}

export function updateTextStyle(
  range: Range,
  textStyle: TextStyle,
  fields: string,
): UpdateTextStyleRequest {
  return {
    updateTextStyle: { range, textStyle, fields },
  };
}

export function updateParagraphStyle(
  range: Range,
  paragraphStyle: ParagraphStyle,
  fields: string,
): UpdateParagraphStyleRequest {
  return {
    updateParagraphStyle: { range, paragraphStyle, fields },
  };
}

export function createParagraphBullets(
  range: Range,
  bulletPreset: string,
): CreateParagraphBulletsRequest {
  return {
    createParagraphBullets: { range, bulletPreset },
  };
}

export function insertTable(
  rows: number,
  columns: number,
  index: number,
): InsertTableRequest {
  return {
    insertTable: { rows, columns, location: { index } },
  };
}

export function insertInlineImage(
  uri: string,
  index: number,
): InsertInlineImageRequest {
  return {
    insertInlineImage: {
      uri,
      location: { index },
    },
  };
}
