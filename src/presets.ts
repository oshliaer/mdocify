import type { Alignment, NamedStyleMap } from './types/options.js';

export interface Preset {
  alignment?: Alignment;
  fontFamily?: string;
  fontSize?: number;
  namedStyles?: NamedStyleMap;
}

export const PRESETS: Record<string, Preset> = {
  legal: {
    alignment: 'justified',
    namedStyles: {
      NORMAL_TEXT: { fontFamily: 'Open Sans', fontSize: 11 },
      HEADING_1: { fontFamily: 'Open Sans', fontSize: 20 },
      HEADING_2: { fontFamily: 'Open Sans', fontSize: 16 },
      HEADING_3: { fontFamily: 'Open Sans', fontSize: 14 },
      HEADING_4: { fontFamily: 'Open Sans', fontSize: 12 },
      HEADING_5: { fontFamily: 'Open Sans', fontSize: 11 },
      HEADING_6: { fontFamily: 'Open Sans', fontSize: 11 },
    },
  },
};

export function resolvePreset(name: string): Preset {
  const p = PRESETS[name];
  if (!p) {
    const names = Object.keys(PRESETS).join(', ');
    throw new Error(`Unknown preset "${name}". Available: ${names}`);
  }
  return p;
}
