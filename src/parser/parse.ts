import { unified } from 'unified';
import remarkParse from 'remark-parse';
import remarkGfm from 'remark-gfm';
import remarkStringify from 'remark-stringify';
import type { Root } from 'mdast';

const processor = unified()
  .use(remarkParse)
  .use(remarkGfm);

const stringifier = unified()
  .use(remarkParse)
  .use(remarkGfm)
  .use(remarkStringify, {
    bullet: '-',
    emphasis: '*',
    strong: '*',
    rule: '-',
    listItemIndent: 'one',
  });

export function parse(markdown: string): Root {
  return processor.parse(markdown);
}

export function stringify(tree: Root): string {
  return stringifier.stringify(tree);
}
