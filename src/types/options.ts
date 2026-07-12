export type Alignment = 'start' | 'center' | 'end' | 'justified' | 'none';

export interface TextStyleSpec {
  fontFamily?: string;
  fontSize?: number;
}

/** Map from `namedStyleType` (e.g. "NORMAL_TEXT", "HEADING_1") to a text style override. */
export type NamedStyleMap = Partial<Record<string, TextStyleSpec>>;

export interface ConvertOptions {
  title?: string;
  documentId?: string;
  verify?: boolean;
  output?: string;
  /** Preset name — applies a bundle of post-upload settings (see src/presets.ts). Explicit options below win over the preset. */
  preset?: string;
  /** Paragraph alignment applied after upload. `'none'` skips. */
  alignment?: Alignment;
  /** Font family applied as a single run-style override to the whole document. */
  fontFamily?: string;
  /** Font size (pt) applied as a single run-style override to the whole document. */
  fontSize?: number;
  /** Per-namedStyle text overrides — respects heading sizes, only changes the style you actually target. */
  namedStyles?: NamedStyleMap;
}

export interface ConvertResult {
  documentId: string;
  title: string;
  url: string;
  losses: LossReport[];
}

export interface LossReport {
  line: number;
  element: string;
  original: string;
  exported: string;
  recommendation: string;
}
