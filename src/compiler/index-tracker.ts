export class IndexTracker {
  private cursor: number;

  constructor(startIndex: number = 1) {
    this.cursor = startIndex;
  }

  get current(): number {
    return this.cursor;
  }

  insert(text: string): { startIndex: number; endIndex: number } {
    const start = this.cursor;
    const length = this.utf16Length(text);
    this.cursor += length;
    return { startIndex: start, endIndex: this.cursor };
  }

  advance(n: number): void {
    this.cursor += n;
  }

  setCursor(n: number): void {
    this.cursor = n;
  }

  peek(): number {
    return this.cursor;
  }

  utf16Length(str: string): number {
    let len = 0;
    for (const ch of str) {
      const code = ch.codePointAt(0)!;
      len += code > 0xffff ? 2 : 1;
    }
    return len;
  }
}
