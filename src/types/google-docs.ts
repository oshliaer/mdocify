export interface Range {
  startIndex: number;
  endIndex: number;
}

export interface Location {
  index: number;
}

export interface EndOfSegmentLocation {
  segmentId?: string;
}

export interface RgbColor {
  red?: number;
  green?: number;
  blue?: number;
}

export interface OptionalColor {
  color?: { rgbColor: RgbColor };
}

export interface Link {
  url: string;
}

export interface WeightedFontFamily {
  fontFamily: string;
  weight?: number;
}

export interface TextStyle {
  bold?: boolean;
  italic?: boolean;
  strikethrough?: boolean;
  underline?: boolean;
  link?: Link;
  weightedFontFamily?: WeightedFontFamily;
  foregroundColor?: OptionalColor;
  backgroundColor?: OptionalColor;
  fontSize?: { magnitude: number; unit: 'PT' };
}

export interface ParagraphStyle {
  namedStyleType?: string;
  indentStart?: { magnitude: number; unit: 'PT' };
  indentFirstLine?: { magnitude: number; unit: 'PT' };
  borderLeft?: {
    color: OptionalColor;
    width: { magnitude: number; unit: 'PT' };
    padding: { magnitude: number; unit: 'PT' };
    dashStyle: string;
  };
  shading?: { backgroundColor: OptionalColor };
  spaceAbove?: { magnitude: number; unit: 'PT' };
  spaceBelow?: { magnitude: number; unit: 'PT' };
}

export interface InsertTextRequest {
  insertText: {
    text: string;
    location?: Location;
    endOfSegmentLocation?: EndOfSegmentLocation;
  };
}

export interface UpdateTextStyleRequest {
  updateTextStyle: {
    range: Range;
    textStyle: TextStyle;
    fields: string;
  };
}

export interface UpdateParagraphStyleRequest {
  updateParagraphStyle: {
    range: Range;
    paragraphStyle: ParagraphStyle;
    fields: string;
  };
}

export interface CreateParagraphBulletsRequest {
  createParagraphBullets: {
    range: Range;
    bulletPreset: string;
  };
}

export interface InsertTableRequest {
  insertTable: {
    rows: number;
    columns: number;
    location: Location;
  };
}

export interface InsertInlineImageRequest {
  insertInlineImage: {
    uri: string;
    location: Location;
    objectSize?: {
      width?: { magnitude: number; unit: 'PT' };
      height?: { magnitude: number; unit: 'PT' };
    };
  };
}

export interface InsertSectionBreakRequest {
  insertSectionBreak: {
    location: Location;
    sectionType: string;
  };
}

export interface DeleteContentRangeRequest {
  deleteContentRange: {
    range: Range;
  };
}

export type BatchRequest =
  | InsertTextRequest
  | UpdateTextStyleRequest
  | UpdateParagraphStyleRequest
  | CreateParagraphBulletsRequest
  | InsertTableRequest
  | InsertInlineImageRequest
  | InsertSectionBreakRequest
  | DeleteContentRangeRequest;
