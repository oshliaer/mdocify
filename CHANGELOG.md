# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.3.0] — 2026-04-22

### Added
- **Presets** — `--preset <name>` flag and `src/presets.ts` registry. Each preset is a declarative bundle of post-upload settings (alignment, per-`namedStyleType` text styling, optional document-wide font overrides). First preset: `legal` (justified + Open Sans; NORMAL_TEXT 11 pt; H1 20 / H2 16 / H3 14 / H4 12 / H5 11 / H6 11 pt).
- `namedStyles` option in `ConvertOptions` and in presets — map from `namedStyleType` (`NORMAL_TEXT`, `HEADING_1`, …) to `{ fontFamily?, fontSize? }`. Keeps heading sizes intact instead of collapsing the whole document to one run style.
- `--alignment <value>` CLI flag (and `alignment` option in `ConvertOptions`) — optional post-upload paragraph alignment. Values: `start`, `center`, `end`, `justified`, `none`.
- `--font <family>` and `--font-size <pt>` flags (and `fontFamily` / `fontSize` options) — single-style override applied to the entire document (use sparingly; prefer `namedStyles`).
- `applyAlignment(documentId, alignment)`, `applyTextStyle(documentId, style)`, `applyNamedStyles(documentId, map)`, and `exportAsDocx(fileId, outputPath)` executor helpers.

### Changed
- **Existing-document update (`--document-id`) now goes through a DOCX intermediate instead of HTML.** HTML re-import stripped bullet lists; DOCX preserves them.
- Post-upload styling (alignment/font) is now opt-in via preset or explicit flags. By default mdocify leaves Drive's native conversion output untouched.

### Fixed
- Unordered markdown lists (`- item`) no longer lose bullet markers when updating an existing document (#17).

## [0.2.0] — 2026-04-08

### Added
- Native Google Drive upload executor (`src/executor/native.ts`) — replaces batch API text insertion with direct Drive copy for more reliable markdown-to-Doc conversion
- Phase-based document compilation — compiler now splits documents at table boundaries with deferred post-table instruction scheduling
- Extended normalization — additional Google export escape sequences (`\=`, `\_`), table separator lines, empty cell handling, list spacing normalization
- E2E test suite with real Google Docs round-trip verification
- Package published as `@oshliaer/mdocify` on npm — includes `files` field (dist + skill) and `prepublishOnly` build hook

### Changed
- Executor architecture refactored from batch API focus to phase-based compilation workflow
- Normalizer now handles table/list context-aware formatting
- Package renamed to `@oshliaer/mdocify` scope

### Fixed
- Markdown round-trip fidelity improved via phase-based compilation and extended escape handling

## [0.1.0] — 2026-02-15

### Added
- Initial release: mdocify CLI for converting Markdown to Google Docs
- Compiler with two-pass instruction generation (text insertion + style application)
- Remark-based parser with unified ecosystem integration
- Normalizer for Google export markdown handling
- Commander-based CLI with `convert` subcommand
