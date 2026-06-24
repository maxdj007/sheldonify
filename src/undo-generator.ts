import path from 'node:path';
import { MoveOperation } from './types.js';
import { normalizePath } from './utils/platform.js';

export function generateUndoSh(operations: MoveOperation[], targetDir: string): string {
  const lines: string[] = [
    '#!/bin/bash',
    'set -euo pipefail',
    'echo "Undoing sheldonify organization..."',
    '',
  ];

  const createdDirs = new Set<string>();

  // Reverse operations in LIFO order
  for (const op of [...operations].reverse()) {
    const from = normalizePath(path.relative(targetDir, op.destination));
    const to = normalizePath(path.relative(targetDir, op.source));
    const toDir = normalizePath(path.dirname(to));

    if (toDir !== '.') {
      lines.push(`mkdir -p "${toDir}"`);
    }
    lines.push(`mv "${from}" "${to}"`);

    const destDir = normalizePath(path.relative(targetDir, path.dirname(op.destination)));
    if (destDir !== '.') {
      createdDirs.add(destDir);
    }
  }

  lines.push('');
  lines.push('# Remove created directories (only if empty)');

  // Sort dirs by depth descending so children are removed before parents
  const sortedDirs = [...createdDirs].sort((a, b) => b.split('/').length - a.split('/').length);
  for (const dir of sortedDirs) {
    lines.push(`rmdir "${dir}" 2>/dev/null || true`);
  }

  lines.push('');
  lines.push('echo "Undo complete."');
  return lines.join('\n') + '\n';
}

export function generateUndoPs1(operations: MoveOperation[], targetDir: string): string {
  const lines: string[] = [
    'Write-Host "Undoing sheldonify organization..."',
    '',
  ];

  const createdDirs = new Set<string>();

  for (const op of [...operations].reverse()) {
    const from = path.relative(targetDir, op.destination);
    const to = path.relative(targetDir, op.source);
    const toDir = path.dirname(to);

    if (toDir !== '.') {
      lines.push(`New-Item -ItemType Directory -Force -Path "${toDir}" | Out-Null`);
    }
    lines.push(`Move-Item -Path "${from}" -Destination "${to}"`);

    const destDir = path.relative(targetDir, path.dirname(op.destination));
    if (destDir !== '.') {
      createdDirs.add(destDir);
    }
  }

  lines.push('');
  lines.push('# Remove created directories (only if empty)');

  const sortedDirs = [...createdDirs].sort((a, b) => b.split(path.sep).length - a.split(path.sep).length);
  for (const dir of sortedDirs) {
    lines.push(`if ((Test-Path "${dir}") -and @(Get-ChildItem "${dir}" -Force).Count -eq 0) { Remove-Item "${dir}" }`);
  }

  lines.push('');
  lines.push('Write-Host "Undo complete."');
  return lines.join('\r\n') + '\r\n';
}
