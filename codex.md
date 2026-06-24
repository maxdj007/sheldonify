# Sheldonify — Codex Integration

Sheldonify is a CLI tool for organizing files in directories. It works as a Codex plugin with skills, hooks, and AGENTS.md support.

## Plugin Structure

```
sheldonify/
├── .claude-plugin/plugin.json   # Plugin manifest (shared with Claude Code)
├── skills/                      # Skills (shared with Claude Code)
│   ├── sheldonify/SKILL.md
│   ├── sheldonify-scan/SKILL.md
│   └── sheldonify-undo/SKILL.md
├── hooks/                       # Lifecycle hooks
│   ├── hooks.json
│   └── check-install.js         # Checks CLI is installed
└── AGENTS.md                    # Auto-loaded by Codex
```

## Lifecycle Hooks

### check-install.js (PreToolUse)

Triggers before any Bash command containing "sheldonify". If the CLI isn't installed, it returns a system message nudging the agent to run `npm install -g sheldonify`.

This hook requires Node.js on your PATH. If Node.js isn't available on the non-interactive shell's PATH (common with nvm/Nix), the skills still work — the hook just stays quiet.

## Skills

- **sheldonify** — Main skill. Triggered when user asks to organize, sort, clean up, or tidy files/folders.
- **sheldonify-scan** — Scan skill. Triggered when user wants to analyze a directory or use LLM-assisted classification.
- **sheldonify-undo** — Undo skill. Triggered when user wants to reverse a previous organization.
