---
name: sheldonify-scan
description: Use this skill when the user asks to "scan files", "analyze a directory for organization", "what's in this folder", or wants to preview how sheldonify would classify files before organizing. Also use when the user wants smart context-based classification that uses LLM judgment.
version: 0.1.0
---

# Sheldonify Scan — Intelligent File Analysis

The scan command extracts rich metadata from files and provides heuristic classification guesses. Use this when you need to analyze a directory before organizing, or when the context strategy needs LLM-powered classification.

## Usage

```bash
sheldonify scan <directory> --json
```

## Output Format

The scan outputs JSON with file metadata and heuristic guesses:

```json
{
  "targetDir": "/path/to/dir",
  "totalFiles": 42,
  "files": [
    {
      "relativePath": "report.pdf",
      "name": "report.pdf",
      "extension": "pdf",
      "size": 1048576,
      "modifiedAt": "2026-06-25T10:00:00Z",
      "createdAt": "2026-01-15T08:30:00Z",
      "media": null,
      "heuristicGuess": {
        "category": "Exports",
        "confidence": 0.8,
        "reason": "filename contains \"report\""
      }
    },
    {
      "relativePath": "data_v2.bin",
      "name": "data_v2.bin",
      "extension": "bin",
      "size": 524288,
      "modifiedAt": "2026-03-10T14:20:00Z",
      "createdAt": "2026-03-10T14:20:00Z",
      "media": null,
      "heuristicGuess": null
    }
  ],
  "uncertainFiles": [
    {
      "file": "data_v2.bin",
      "candidates": [
        { "category": "Unsorted", "confidence": 0.1, "reason": "no context signals found" }
      ]
    }
  ]
}
```

## Your Role as LLM

1. Read the scan output
2. For files with `heuristicGuess: null` or low confidence — classify them yourself based on filename, extension, size, dates, and any context the user provides
3. For files with high-confidence guesses — accept the heuristic or override if you disagree
4. Build a classification plan and apply it:

```bash
sheldonify apply <directory> --plan plan.json
```

Plan format:

```json
{
  "classifications": [
    { "file": "data_v2.bin", "category": "Backups", "reason": "binary data file, likely a backup" },
    { "file": "report.pdf", "category": "Reports", "reason": "report document" }
  ]
}
```

## When to Use Scan vs Direct

- **Direct** (`sheldonify . --strategy type`): When organizing by type/date — no LLM needed
- **Scan + Apply**: When using context strategy, or when the user wants you to make smart classification decisions
