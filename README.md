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

Requires Google Workspace authentication via `gws` CLI.

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
| `npm run prepublishOnly` | Auto-build before npm publish |

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
