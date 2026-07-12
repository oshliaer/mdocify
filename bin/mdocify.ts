#!/usr/bin/env node

import { Command } from 'commander';
import { convert } from '../src/index.js';

const program = new Command();

program
  .name('mdocify')
  .description('Convert Markdown to Google Docs via batch API')
  .version('0.1.0');

program
  .command('convert')
  .description('Convert a Markdown file to a Google Doc')
  .argument('<file>', 'Path to the Markdown file')
  .option('-t, --title <title>', 'Document title (defaults to filename)')
  .option('-d, --document-id <id>', 'Existing document ID to update')
  .option('--verify', 'Run round-trip verification after conversion')
  .option('-o, --output <path>', 'Path to save exported markdown (with --verify)')
  .option('-p, --preset <name>', 'Named bundle of post-upload settings (e.g. "legal")')
  .option('-a, --alignment <value>', 'Paragraph alignment: start|center|end|justified|none')
  .option('--font <family>', 'Font family (e.g. "Open Sans")')
  .option('--font-size <pt>', 'Font size in points', (v) => parseFloat(v))
  .action(async (file: string, opts: Record<string, string | number | boolean>) => {
    try {
      const result = await convert(file, {
        title: opts.title as string | undefined,
        documentId: opts.documentId as string | undefined,
        verify: opts.verify as boolean | undefined,
        output: opts.output as string | undefined,
        preset: opts.preset as string | undefined,
        alignment: opts.alignment as 'start' | 'center' | 'end' | 'justified' | 'none' | undefined,
        fontFamily: opts.font as string | undefined,
        fontSize: opts.fontSize as number | undefined,
      });

      console.log(`Document created: ${result.url}`);

      if (result.losses.length > 0) {
        process.exit(1);
      }
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : String(error);
      console.error(`Error: ${message}`);
      process.exit(2);
    }
  });

program.parseAsync();
