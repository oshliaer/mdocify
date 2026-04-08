# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

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
