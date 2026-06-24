# Sheldonify Config File Format

Place a `sheldonify.config.json` in the target directory, the user's home directory, or pass via `--config`.

## Full Schema

```json
{
  "strategy": "type",
  "depth": 1,
  "protected": {
    "useDefaults": true,
    "include": ["folder-to-skip"],
    "exclude": ["folder-to-include"]
  },
  "typeStrategy": {
    "extraMappings": { "sketch": "Design", "fig": "Design" },
    "categoryRenames": { "Code": "Source" }
  },
  "contextStrategy": {
    "extraKeywords": { "Tax-Documents": ["tax", "w2", "1099"] }
  },
  "dateStrategy": {
    "dateSource": "modified"
  },
  "customRules": [
    {
      "name": "Tax Documents",
      "match": {
        "extensions": ["pdf"],
        "patterns": ["*tax*", "*w2*"],
        "regex": "tax-\\d{4}"
      },
      "priority": 10
    }
  ]
}
```

## Custom Rules

Rules are evaluated in priority order (highest first). A file matches if any condition in `match` is true:

- `extensions`: Match file extension (without dot, lowercase)
- `patterns`: Glob patterns matched against filename (case-insensitive)
- `regex`: Regular expression matched against the relative file path (case-insensitive)

Unmatched files go to `Unsorted/`.

## Protected Folders

When `useDefaults` is true, these are automatically skipped:
`.git`, `.svn`, `.hg`, `node_modules`, `.venv`, `venv`, `__pycache__`, `.idea`, `.vscode`, `.vs`, `vendor`, `bower_components`, `.terraform`, `.serverless`, `.next`, `.nuxt`, `.svelte-kit`, `_duplicates`, all dotfolders, and any folder containing project markers (`package.json`, `Cargo.toml`, `go.mod`, etc.).

Use `include` to add more patterns to skip, `exclude` to remove patterns from the default list.
