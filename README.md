# mdocify

[![npm version](https://img.shields.io/npm/v/@oshliaer/mdocify.svg)](https://www.npmjs.com/package/@oshliaer/mdocify)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

CLI tool for converting Markdown to Google Docs via native Drive upload with phase-based compilation and round-trip normalization.

## Features

- **Native Drive upload** — Direct Google Drive copy instead of batch API text insertion for reliable conversion
- **Phase-based compilation** — Documents split at table boundaries with deferred instruction scheduling
- **Extended normalization** — Handles Google export escape sequences, table separators, empty cells, and list spacing
- **Round-trip fidelity** — Input markdown survives Google Docs export and re-import with minimal loss
- **npm-published** — Installable package with compiled distribution and CLI binary

## Quick Start

### Installation

```bash
npm install -g @oshliaer/mdocify
# or
npx @oshliaer/mdocify convert <file.md>
```

### Usage

```bash
mdocify convert <markdown-file>
```

Common flags:

- `--document-id <id>` — update an existing document (DOCX-intermediate path preserves bullet lists)
- `--preset <name>` — apply a named bundle of post-upload settings (e.g. `legal`, see "Presets" below)
- `--alignment <value>` — paragraph alignment applied after upload (`start`, `center`, `end`, `justified`, `none`)
- `--font <family>` — font family applied document-wide (e.g. `"Open Sans"`)
- `--font-size <pt>` — font size in points
- `--verify` — run round-trip verification after conversion

Explicit flags override values provided by a preset. By default mdocify leaves Drive's native styling untouched.

Requires Google Workspace authentication via `gws` CLI.

## Presets

Presets are named bundles of post-upload settings declared in [`src/presets.ts`](src/presets.ts). The CLI stays simple and exposes primitive flags; skills and scripts call it with a preset name instead of repeating the same flag combination.

Each preset can set:

- `alignment` — paragraph alignment applied to the whole body.
- `namedStyles` — per-`namedStyleType` text styling (`NORMAL_TEXT`, `HEADING_1`, …). Prefer this over a document-wide `fontFamily`/`fontSize`: it keeps heading sizes distinct instead of collapsing everything to one run style.
- `fontFamily` / `fontSize` — document-wide override applied as a single run style. Useful for quick-and-dirty tweaks; explicit flags win over preset values.

### `legal`

| Scope | Font | Size |
|-------|------|------|
| `NORMAL_TEXT` | Open Sans | 11 pt |
| `HEADING_1` | Open Sans | 20 pt |
| `HEADING_2` | Open Sans | 16 pt |
| `HEADING_3` | Open Sans | 14 pt |
| `HEADING_4` | Open Sans | 12 pt |
| `HEADING_5` | Open Sans | 11 pt |
| `HEADING_6` | Open Sans | 11 pt |
| Alignment | `JUSTIFIED` (whole body) | |

Usage:

```bash
mdocify convert contract.md --document-id <id> --preset legal
# override a single slot
mdocify convert contract.md --preset legal --font-size 12
```

To add a preset, extend the `PRESETS` object in `src/presets.ts` and document it here. Keep presets declarative — avoid embedding execution logic in skills or wrappers; the CLI applies the bundle itself.

### Known limitation — `namedStyles` vs theme defaults

Presets only style paragraphs that actually exist in the document; they do **not** mutate the document-level `namedStyles` entries themselves (the Docs API has no "update named style" request). If a `namedStyleType` has no paragraph at upload time, Google Docs keeps its built-in default when the user later switches a paragraph to that style. For stricter theming, generate the target Doc from a prepared template instead.

## Architecture

```
md → remark-parse (MDAST)
  → compiler (phase-based BatchRequest[])
  → executor (native Drive upload)
  → Google Doc (with round-trip normalization)
```

### Key Concepts

- **Batch compilation** — Two-pass instruction generation: text insertion (forward) then style application (backward by indices)
- **Phase-based splitting** — Document split into phases at table boundaries; each phase compiled independently with deferred post-table instructions
- **Round-trip testing** — Verify markdown → Doc → export → normalized md with minimal changes
- **UTF-16 code units** — All indices calculated per Google Docs API requirements

## Scripts and Commands

| Command | Purpose |
|---------|---------|
| `npm run build` | Compile TypeScript to JavaScript (`dist/`) |
| `npm run dev -- convert <file>` | Run mdocify in development mode |
| `npm test` | Run unit and integration tests (vitest) |
| `npm run test:watch` | Run tests in watch mode |
| `npm run test:e2e` | Run end-to-end tests against real Google Docs (requires authentication) |
| `npm run prepare` | Auto-build before npm publish and git-based installs |

## Configuration

### Environment Variables

| Variable | Purpose |
|----------|---------|
| `MDOCIFY_E2E` | Set to `1` to enable E2E test mode (requires Google auth) |

### Files

- **Source:** `src/` (TypeScript)
  - `src/index.ts` — Main entry point
  - `src/compiler/` — MDAST → batch instructions
  - `src/executor/` — Drive upload and native execution
  - `src/roundtrip/` — Export normalization
- **Distribution:** `dist/` (compiled JavaScript, published to npm)
- **Skill:** `skill/` — AI assistant skill definition
- **Tests:**
  - `tests/` — Unit and integration tests
  - `tests/e2e/` — Real Google Docs round-trip tests

## Requirements

- **Node.js** ≥ 18
- **Google Workspace** account with `gws` CLI configured
- **TypeScript** 5.4+ (for development)

## Development

```bash
# Install dependencies
npm install

# Build
npm run build

# Test
npm test

# E2E test (requires gws auth)
npm run test:e2e
```

## Google Docs Export Escaping

Google Docs export applies escaping to markdown:
- `` ` `` (backtick) → `` \` ``
- `=` (equals) → `\=`
- `_` (underscore) → `\_`

Fenced code blocks are inserted as literal triple-backticks in text (escaped); the normalizer unescapes them during round-trip.

## License

MIT
