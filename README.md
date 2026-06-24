# sheldonify

CLI tool to organize messy directories into clean folders. Sort by file type, context, date, or custom rules. Detects duplicates, skips protected folders (.git, node_modules), generates undo scripts. Works standalone or as an AI agent plugin with structured JSON output. Never deletes data — only moves and organizes.

## Install

```bash
npm install -g sheldonify
```

Or run directly:

```bash
npx sheldonify ./Downloads
```

## Quick Start

```bash
# Preview what will happen (dry run)
sheldonify ./Downloads --dry-run

# Organize by file type (default)
sheldonify ./Downloads

# Organize by date
sheldonify ./Documents --strategy date

# Organize by context (uses filename heuristics)
sheldonify ./Desktop --strategy context

# Use custom rules
sheldonify . --strategy custom --config rules.json
```

## Strategies

### Type (default)

Groups files by extension into folders like `Images/`, `Documents/`, `Code/`, `Videos/`, `Audio/`, `Archives/`, `Fonts/`, `Executables/`, `Data/`, `Design/`.

```bash
sheldonify . --strategy type
```

```
Before:                    After:
├── photo.jpg              ├── Images/
├── report.pdf             │   └── photo.jpg
├── app.ts                 ├── Documents/
├── song.mp3               │   └── report.pdf
└── backup.zip             ├── Code/
                           │   └── app.ts
                           ├── Audio/
                           │   └── song.mp3
                           └── Archives/
                               └── backup.zip
```

### Context

Classifies files by their purpose using filename keywords, parent folder names, and file metadata. Uses a hybrid approach: heuristics for confident matches, and an LLM bridge for ambiguous files when used with AI agents.

```bash
sheldonify . --strategy context
```

Recognizes: Screenshots, Receipts, Resumes, Contracts, Photos, Backups, Logs, Config, Design, Notes, Presentations, Spreadsheets, Templates, Exports, Downloads.

### Date

Organizes into `Year/Month` folders based on file modification date.

```bash
sheldonify . --strategy date
```

```
After:
├── 2026/
│   ├── 01-January/
│   ├── 06-June/
│   └── 12-December/
└── 2025/
    └── 11-November/
```

### Custom

Define your own sorting rules in a config file.

```bash
sheldonify . --strategy custom --config rules.json
```

```json
{
  "customRules": [
    {
      "name": "Tax Documents",
      "match": { "patterns": ["*tax*", "*w2*"], "extensions": ["pdf"] },
      "priority": 10
    },
    {
      "name": "Work Projects",
      "match": { "regex": "project-.*" },
      "priority": 5
    }
  ]
}
```

Unmatched files are moved to `Unsorted/`.

## Features

### Duplicate Detection

Finds files with identical content using SHA-256 hashing. Keeps one copy in place, moves extras to `_duplicates/` with metadata sidecars for traceability.

```bash
# Duplicates are automatically detected and handled
sheldonify ./Downloads --strategy type
```

### Protected Folders

Automatically skips directories that shouldn't be reorganized:

- Version control: `.git`, `.svn`, `.hg`
- Dependencies: `node_modules`, `.venv`, `vendor`
- IDE config: `.idea`, `.vscode`
- Build output: `dist`, `build`, `.next`
- Project roots: any folder containing `package.json`, `Cargo.toml`, `go.mod`, etc.
- All dotfolders

Override via config:

```json
{
  "protected": {
    "useDefaults": true,
    "include": ["my-special-folder"],
    "exclude": ["dist"]
  }
}
```

### Undo

Every run generates undo scripts that reverse all changes:

- `_sheldonify-undo.sh` — Bash
- `_sheldonify-undo.ps1` — PowerShell
- `_sheldonify-index.json` — Machine-readable index with full undo mapping

```bash
# Undo the last organization
bash _sheldonify-undo.sh
```

### Uncertain File Review

When using the `context` strategy, files that match multiple categories with similar confidence are flagged for review instead of being silently misclassified.

```
⚠ The following files need your input:

  data_backup_v2.xlsx
    → Backups (40%: filename contains "backup")
    → Spreadsheets (40%: extension .xlsx suggests Spreadsheets)
```

## AI Agent Integration

Sheldonify is designed to work as a plugin for AI coding agents (Claude Code, Codex, etc.).

### JSON Output

```bash
sheldonify . --strategy type --dry-run --json
```

Returns structured JSON to stdout with plan details, stats, and operations.

### LLM Bridge (Context Strategy)

Two-step workflow for AI agents:

```bash
# Step 1: Scan and output file metadata with heuristic guesses
sheldonify scan ./Downloads --json > scan-results.json

# Step 2: Agent's LLM classifies uncertain files, writes plan
# Step 3: Apply the classification
sheldonify apply ./Downloads --plan classifications.json
```

The plan file format:

```json
{
  "classifications": [
    { "file": "mystery_file.dat", "category": "Backups", "reason": "appears to be a database backup" }
  ]
}
```

### Exit Codes

| Code | Meaning |
|------|---------|
| 0 | Success |
| 1 | Runtime error |
| 2 | Invalid arguments/config |
| 3 | Target not found |
| 4 | Nothing to do |

## CLI Reference

```
sheldonify [directory] [options]

Options:
  -s, --strategy <name>   Sorting strategy: type|context|date|custom (default: type)
  -d, --depth <number>    Recursion depth (default: 1)
  --dry-run               Preview changes without executing
  --config <path>         Path to config file
  --verbose               Detailed output
  --json                  Structured JSON output for agents
  -V, --version           Output version number
  -h, --help              Display help

Commands:
  scan <directory>        Scan and output file metadata (for LLM bridge)
  apply <directory>       Apply a classification plan from scan results
```

## Configuration

Place a `sheldonify.config.json` in the target directory or your home directory.

```json
{
  "strategy": "type",
  "depth": 1,
  "protected": {
    "useDefaults": true,
    "include": [],
    "exclude": []
  },
  "typeStrategy": {
    "extraMappings": { "sketch": "Design" },
    "categoryRenames": { "Code": "Source" }
  },
  "contextStrategy": {
    "extraKeywords": { "Tax-Documents": ["tax", "w2", "1099"] }
  },
  "dateStrategy": {
    "dateSource": "modified"
  },
  "customRules": []
}
```

## Requirements

- Node.js >= 18
- Optional: `sharp` (image metadata), `ffprobe` (video/audio metadata)

## License

Apache 2.0 — see [LICENSE](LICENSE)
