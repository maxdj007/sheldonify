# Sheldonify — File & Folder Organizer

You have access to `sheldonify`, a CLI tool that organizes files in directories. Install with `npm install -g sheldonify`.

## Quick Reference

```bash
sheldonify <dir> --strategy type --dry-run   # preview by file type
sheldonify <dir> --strategy type             # execute
sheldonify <dir> --strategy date             # by modification date
sheldonify <dir> --strategy context          # by purpose (heuristic)
sheldonify scan <dir> --json                 # scan for LLM classification
sheldonify apply <dir> --plan plan.json      # apply LLM classifications
```

Always preview with `--dry-run` first. Use `--json` for structured output. Every run generates undo scripts (`_sheldonify-undo.sh`, `_sheldonify-undo.ps1`) and an index (`_sheldonify-index.json`). Never deletes data.
