---
name: gws-docs-mdocify
version: 0.1.0
description: "Google Docs: Convert Markdown files to Google Docs via batch API."
metadata:
  openclaw:
    category: "productivity"
    requires:
      bins: ["gws", "npx"]
    cliHelp: "npx mdocify --help"
---

# docs mdocify

> **PREREQUISITE:** Read `../gws-shared/SKILL.md` for auth, global flags, and security rules. If missing, run `gws generate-skills` to create it.

Convert Markdown files to Google Docs via batch API (no ODT/DOCX intermediaries).

## Usage

```bash
npx mdocify convert <file> [options]
```

## Flags

| Flag | Required | Default | Description |
|------|----------|---------|-------------|
| `<file>` | ✓ | — | Path to the Markdown file |
| `--title` | — | filename | Document title |
| `--document-id` | — | — | Update existing document |
| `--verify` | — | false | Run round-trip verification |
| `--output` | — | `$TMPDIR/mdocify-export-<id>.md` | Path for exported markdown (with --verify) |
| `--preset <name>` | — | — | Named bundle of post-upload settings (e.g. `legal`) |
| `--alignment <value>` | — | — | Paragraph alignment: `start` \| `center` \| `end` \| `justified` \| `none` |
| `--font <family>` | — | — | Font family applied document-wide (e.g. `"Open Sans"`) |
| `--font-size <pt>` | — | — | Font size in points |

## Examples

```bash
# Create a new Google Doc from markdown
npx mdocify convert README.md

# With custom title
npx mdocify convert README.md --title "Project Documentation"

# With round-trip verification
npx mdocify convert README.md --verify --output exported.md

# Apply the "legal" preset (justified + Open Sans 11pt) to an existing doc
npx mdocify convert contract.md --document-id <id> --preset legal

# Override a preset value
npx mdocify convert contract.md --preset legal --font-size 12
```

## Presets

Presets are named bundles of post-upload settings defined in `src/presets.ts` of the package.
The skill only references presets by name; execution happens inside mdocify — no wrapping shell logic required.

| Preset | What it sets | Typical use |
|--------|--------------|-------------|
| `legal` | Alignment `JUSTIFIED`; per-heading Open Sans (H1 20 / H2 16 / H3 14 / H4 12 / H5 11 / H6 11 pt); NORMAL_TEXT Open Sans 11 pt | Contracts, acts, offers |

Explicit `--alignment` / `--font` / `--font-size` flags override values from the preset.

## Round-trip Verification

When `--verify` is set, mdocify:
1. Creates the Google Doc
2. Exports it back as markdown via `gws drive files export`
3. Compares input vs exported markdown
4. Reports any losses (missing elements, formatting changes)
5. Exits with code 1 if differences found

## Known Limitations: Google Docs Export Escaping

Google Docs markdown export aggressively escapes certain characters:

| Input | Export | Normalizer fix |
|-------|--------|----------------|
| `` ` `` | `\`` | `\`` → `` ` `` |
| `=` | `\=` | `\=` → `=` |
| `_` | `\_` | `\_` → `_` |

**Fenced code blocks** (` ``` `): mdocify inserts literal fence markers as document text with Courier New styling. Google exports them with escaped backticks (`\`\`\``). The built-in normalizer unescapes them for round-trip verification.

**Trailing spaces**: Google adds `  ` (two spaces) to most lines. Normalizer strips them.

> [!CAUTION]
> This is a **write** command — confirm with the user before executing.

## See Also

- [gws-shared](../gws-shared/SKILL.md) — Global flags and auth
- [gws-docs](../gws-docs/SKILL.md) — All read and write Google Docs commands
