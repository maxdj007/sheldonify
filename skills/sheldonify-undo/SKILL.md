---
name: sheldonify-undo
description: Use this skill when the user asks to "undo sheldonify", "reverse file organization", "put files back", "restore original layout", or wants to revert changes made by sheldonify.
version: 0.1.0
---

# Sheldonify Undo — Reverse File Organization

Every sheldonify run generates undo scripts that reverse all file moves. Use this skill to help users revert changes.

## Undo Methods

### Bash (Linux/macOS/WSL)

```bash
cd <organized-directory>
bash _sheldonify-undo.sh
```

### PowerShell (Windows)

```powershell
cd <organized-directory>
.\_sheldonify-undo.ps1
```

### Programmatic (using the index)

Read `_sheldonify-index.json` and reverse the operations:

```json
{
  "undo": [
    { "from": "Images/photo.jpg", "to": "photo.jpg" },
    { "from": "Documents/report.pdf", "to": "report.pdf" }
  ]
}
```

## Important Notes

- Undo scripts reverse operations in LIFO order (last move undone first)
- Empty directories created by sheldonify are removed during undo
- If the user ran sheldonify multiple times, each run has its own undo scripts — the latest run's scripts are in the target directory
- The undo scripts only reverse file moves — they don't delete the `_sheldonify-index.json` or undo scripts themselves. Clean those up manually after undoing.
