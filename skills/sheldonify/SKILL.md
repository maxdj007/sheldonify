---
name: sheldonify
description: Use this skill when the user asks to "organize files", "sort files", "clean up a directory", "tidy up a folder", "organize my downloads", "sort my desktop", "group files by type", "find duplicate files", or discusses file/folder organization, directory cleanup, or decluttering. Also use when the user mentions "sheldonify" by name.
version: 0.1.0
---

# Sheldonify — File & Folder Organizer

Sheldonify is a CLI tool that organizes files in a directory by type, context, date, or custom rules. It never deletes data — only moves files into organized folders and generates undo scripts.

## Prerequisites

Sheldonify must be installed globally via npm:

```bash
npm install -g sheldonify
```

If not installed, offer to install it for the user before proceeding.

## Commands

### Organize by file type (default)

```bash
sheldonify <directory> --strategy type
```

Groups files into: `Images/`, `Documents/`, `Code/`, `Videos/`, `Audio/`, `Archives/`, `Fonts/`, `Executables/`, `Data/`, `Design/`, `Other/`, `Misc/`.

### Organize by context/purpose

This is the most powerful strategy — it uses filename heuristics and your LLM capabilities together.

**Step 1:** Scan the directory to get file metadata with heuristic guesses:

```bash
sheldonify scan <directory> --json
```

**Step 2:** Read the JSON output. Files with `heuristicGuess: null` or low confidence need your classification. Classify them based on filename patterns, extensions, and context.

**Step 3:** Create a plan JSON file with your classifications:

```json
{
  "classifications": [
    { "file": "relative/path/to/file.ext", "category": "CategoryName", "reason": "why this category" }
  ]
}
```

**Step 4:** Apply the plan:

```bash
sheldonify apply <directory> --plan plan.json
```

### Organize by date

```bash
sheldonify <directory> --strategy date
```

Groups into `YYYY/MM-MonthName/` folders based on modification date.

### Organize with custom rules

```bash
sheldonify <directory> --strategy custom --config rules.json
```

See the references directory for config file format.

## Important Flags

| Flag | Purpose |
|------|---------|
| `--dry-run` | Preview changes without executing. **Always use this first.** |
| `--json` | Structured JSON output — use this for parsing results programmatically |
| `--depth <n>` | Recursion depth (default: 1, current directory only) |
| `--config <path>` | Path to a config file |
| `--verbose` | Detailed logging |

## Workflow

1. **Always start with `--dry-run`** to show the user what will change
2. Ask the user to confirm before executing
3. After execution, mention the undo scripts (`_sheldonify-undo.sh` / `_sheldonify-undo.ps1`) and the index file (`_sheldonify-index.json`)

## Safety

- Sheldonify **never deletes files** — it only moves them
- Every run generates undo scripts (bash + powershell) and a JSON index
- Protected folders are automatically skipped: `.git`, `node_modules`, `.venv`, project roots with `package.json`/`Cargo.toml`/etc.
- Duplicate files are moved to `_duplicates/` with metadata, not deleted

## Handling Uncertain Files

When using the context strategy, some files may be flagged as uncertain (confidence < 50%). Present these to the user with the candidate categories and ask which category to use. Then include the user's choice in the classification plan.

## Exit Codes

| Code | Meaning |
|------|---------|
| 0 | Success |
| 1 | Runtime error |
| 2 | Invalid arguments/config |
| 3 | Target not found |
| 4 | Nothing to do (already organized) |
