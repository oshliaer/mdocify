import { describe, it, expect } from 'vitest';
import { IndexTracker } from '../../src/compiler/index-tracker.js';

describe('IndexTracker', () => {
  it('starts at index 1 by default', () => {
    const tracker = new IndexTracker();
    expect(tracker.current).toBe(1);
  });

  it('starts at custom index', () => {
    const tracker = new IndexTracker(5);
    expect(tracker.current).toBe(5);
  });

  it('tracks ASCII text insertion', () => {
    const tracker = new IndexTracker();
    const range = tracker.insert('Hello');
    expect(range).toEqual({ startIndex: 1, endIndex: 6 });
    expect(tracker.current).toBe(6);
  });

  it('tracks multiple insertions', () => {
    const tracker = new IndexTracker();
    const r1 = tracker.insert('Hello');
    const r2 = tracker.insert(' world');
    expect(r1).toEqual({ startIndex: 1, endIndex: 6 });
    expect(r2).toEqual({ startIndex: 6, endIndex: 12 });
  });

  it('handles newline characters', () => {
    const tracker = new IndexTracker();
    const r1 = tracker.insert('Line 1\n');
    expect(r1).toEqual({ startIndex: 1, endIndex: 8 });
    const r2 = tracker.insert('Line 2\n');
    expect(r2).toEqual({ startIndex: 8, endIndex: 15 });
  });

  it('counts UTF-16 code units for BMP characters', () => {
    const tracker = new IndexTracker();
    // Cyrillic characters are 1 UTF-16 code unit each
    const range = tracker.insert('Привет');
    expect(range).toEqual({ startIndex: 1, endIndex: 7 });
  });

  it('counts UTF-16 surrogate pairs for emoji', () => {
    const tracker = new IndexTracker();
    // 😀 is a surrogate pair (2 UTF-16 code units)
    const range = tracker.insert('😀');
    expect(range).toEqual({ startIndex: 1, endIndex: 3 });
  });

  it('handles mixed ASCII and emoji', () => {
    const tracker = new IndexTracker();
    // "Hi 😀!" = H(1) i(1) (1) 😀(2) !(1) = 6 code units
    const range = tracker.insert('Hi 😀!');
    expect(range).toEqual({ startIndex: 1, endIndex: 7 });
  });

  it('advance moves cursor forward', () => {
    const tracker = new IndexTracker();
    tracker.advance(10);
    expect(tracker.current).toBe(11);
  });

  it('utf16Length returns correct lengths', () => {
    const tracker = new IndexTracker();
    expect(tracker.utf16Length('')).toBe(0);
    expect(tracker.utf16Length('abc')).toBe(3);
    expect(tracker.utf16Length('😀')).toBe(2);
    expect(tracker.utf16Length('a😀b')).toBe(4);
    expect(tracker.utf16Length('🇺🇸')).toBe(4); // flag emoji = 2 surrogate pairs
  });
});
