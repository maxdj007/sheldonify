# Sheldonify

You have access to `sheldonify`, a CLI tool for organizing files in directories. Install: `npm install -g sheldonify`.

## Usage

```bash
sheldonify <dir> --strategy type --dry-run   # preview organization by file type
sheldonify <dir> --strategy type             # execute
sheldonify <dir> --strategy date             # organize by modification date
sheldonify <dir> --strategy context          # organize by purpose (heuristics)
sheldonify scan <dir> --json                 # scan for LLM-assisted classification
sheldonify apply <dir> --plan plan.json      # apply classifications from scan
sheldonify <dir> --strategy custom --config rules.json  # custom rules
```

## Rules

- Always `--dry-run` first, then confirm with user before executing
- Use `--json` flag when you need to parse output programmatically
- Every run generates undo scripts and a JSON index — mention these to the user
- For context strategy: scan first, classify uncertain files yourself, then apply
- Tool never deletes data — only moves files into organized folders
- Protected folders (.git, node_modules, project roots) are automatically skipped
