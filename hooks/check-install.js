#!/usr/bin/env node

// PreToolUse hook: checks if sheldonify CLI is installed when a sheldonify command is about to run.
// If not installed, nudges the agent to install it first.

import { execSync } from 'node:child_process';

let input = '';
process.stdin.setEncoding('utf-8');
process.stdin.on('data', chunk => { input += chunk; });
process.stdin.on('end', () => {
  try {
    const data = JSON.parse(input);
    const toolInput = data.tool_input ?? '';

    if (typeof toolInput !== 'string' || !toolInput.includes('sheldonify')) {
      process.exit(0);
    }

    try {
      execSync('sheldonify --version', { stdio: 'ignore' });
    } catch {
      const msg = {
        systemMessage: 'sheldonify is not installed. Run: npm install -g sheldonify'
      };
      process.stdout.write(JSON.stringify(msg));
    }
  } catch {
    // never block due to hook errors
  }
  process.exit(0);
});
