import fs from 'node:fs/promises';
import path from 'node:path';
import { FileEntry, SheldonifyConfig } from './types.js';
import { getExtension } from './utils/platform.js';
import { hasProjectMarker } from './protected.js';

export interface ScanWarnings {
  symlinksSkipped: string[];
  unreadable: string[];
}

const scanWarnings: ScanWarnings = { symlinksSkipped: [], unreadable: [] };

export function getScanWarnings(): ScanWarnings {
  return scanWarnings;
}

export async function scanDirectory(
  targetDir: string,
  config: SheldonifyConfig,
  isProtected: (absPath: string) => boolean
): Promise<FileEntry[]> {
  scanWarnings.symlinksSkipped = [];
  scanWarnings.unreadable = [];
  const files: FileEntry[] = [];
  await walk(targetDir, targetDir, 0, config.depth, isProtected, files);
  return files;
}

async function walk(
  currentDir: string,
  rootDir: string,
  currentDepth: number,
  maxDepth: number,
  isProtected: (absPath: string) => boolean,
  results: FileEntry[]
): Promise<void> {
  let entries;
  try {
    entries = await fs.readdir(currentDir, { withFileTypes: true });
  } catch {
    scanWarnings.unreadable.push(currentDir);
    return;
  }

  for (const entry of entries) {
    const absPath = path.join(currentDir, entry.name);

    if (entry.isSymbolicLink()) {
      scanWarnings.symlinksSkipped.push(path.relative(rootDir, absPath));
      continue;
    }

    if (entry.isDirectory()) {
      if (isProtected(absPath)) continue;

      const isProject = await hasProjectMarker(absPath);
      if (isProject) continue;

      if (currentDepth < maxDepth) {
        await walk(absPath, rootDir, currentDepth + 1, maxDepth, isProtected, results);
      }
      continue;
    }

    if (!entry.isFile()) continue;
    if (entry.name.startsWith('_sheldonify-')) continue;

    try {
      const stat = await fs.stat(absPath);
      const fileEntry: FileEntry = {
        absolutePath: absPath,
        relativePath: path.relative(rootDir, absPath),
        name: entry.name,
        extension: getExtension(entry.name),
        size: stat.size,
        modifiedAt: stat.mtime,
        createdAt: stat.birthtime,
        isDirectory: false,
      };
      results.push(fileEntry);
    } catch {
      scanWarnings.unreadable.push(absPath);
    }
  }
}
