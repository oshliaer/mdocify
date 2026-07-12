import { describe, it, expect } from 'vitest';
import { PRESETS, resolvePreset } from '../src/presets.js';

describe('resolvePreset', () => {
  it('returns the requested preset', () => {
    expect(resolvePreset('legal')).toBe(PRESETS.legal);
  });

  it('throws on an unknown preset and lists available names', () => {
    expect(() => resolvePreset('nope')).toThrow(/Unknown preset "nope"/);
    expect(() => resolvePreset('nope')).toThrow(/legal/);
  });
});

describe('legal preset', () => {
  const legal = PRESETS.legal;

  it('justifies the whole body', () => {
    expect(legal.alignment).toBe('justified');
  });

  it('styles NORMAL_TEXT and headings with Open Sans', () => {
    expect(legal.namedStyles?.NORMAL_TEXT).toEqual({ fontFamily: 'Open Sans', fontSize: 11 });
    expect(legal.namedStyles?.HEADING_1).toEqual({ fontFamily: 'Open Sans', fontSize: 20 });
    expect(legal.namedStyles?.HEADING_2).toEqual({ fontFamily: 'Open Sans', fontSize: 16 });
    expect(legal.namedStyles?.HEADING_3).toEqual({ fontFamily: 'Open Sans', fontSize: 14 });
  });

  it('does not set a document-wide font override (prefers namedStyles)', () => {
    expect(legal.fontFamily).toBeUndefined();
    expect(legal.fontSize).toBeUndefined();
  });
});
