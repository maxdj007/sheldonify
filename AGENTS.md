# Sheldonify — File & Folder Organizer

You have access to `sheldonify`, a CLI tool that organizes files in directories.

## Installation

```bash
npm install -g sheldonify
```

## Commands

### Organize files by type
```bash
sheldonify <directory> --strategy type --dry-run    # preview
sheldonify <directory> --strategy type              # execute
```

### Organize files by date
```bash
sheldonify <directory> --strategy date
```

### Organize by context (with LLM classification)
```bash
sheldonify scan <directory> --json                  # get file metadata
# classify uncertain files yourself, write plan.json
sheldonify apply <directory> --plan plan.json       # apply classifications
```

### Organize with custom rules
```bash
sheldonify <directory> --strategy custom --config rules.json
```

## Key Flags

- `--dry-run` — always preview first before executing
- `--json` — structured output for programmatic use
- `--depth <n>` — recursion depth (default: 1)
- `--verbose` — detailed logging

## Safety

- Never deletes data — only moves files
- Generates undo scripts: `_sheldonify-undo.sh` (bash), `_sheldonify-undo.ps1` (powershell)
- Generates index: `_sheldonify-index.json` with full before/after mapping
- Automatically skips: `.git`, `node_modules`, `.venv`, project roots, all dotfolders
- Detects duplicates by content hash — moves extras to `_duplicates/`

## Workflow

1. Always run with `--dry-run` first and show the user what will change
2. Get user confirmation before executing
3. After execution, mention the undo scripts and index file
4. For context strategy, use your LLM capabilities to classify uncertain files
