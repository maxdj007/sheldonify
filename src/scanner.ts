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

      if (currentDepth === 0) {
        // Top-level subdirectories: always move as a whole unit
        const dirEntry = await buildDirectoryEntry(absPath, rootDir);
        if (dirEntry) results.push(dirEntry);
      } else if (currentDepth < maxDepth) {
        const isProject = await hasProjectMarker(absPath);
        if (!isProject) {
          await walk(absPath, rootDir, currentDepth + 1, maxDepth, isProtected, results);
        }
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

async function buildDirectoryEntry(
  absPath: string,
  rootDir: string
): Promise<FileEntry | null> {
  const extensions = await collectExtensions(absPath);
  if (extensions.length === 0) return null;

  const dominant = findDominantExtension(extensions);

  try {
    const stat = await fs.stat(absPath);
    return {
      absolutePath: absPath,
      relativePath: path.relative(rootDir, absPath),
      name: path.basename(absPath),
      extension: dominant,
      size: 0,
      modifiedAt: stat.mtime,
      createdAt: stat.birthtime,
      isDirectory: true,
      dominantExtension: dominant,
    };
  } catch {
    return null;
  }
}

async function collectExtensions(dirPath: string): Promise<string[]> {
  const extensions: string[] = [];
  try {
    const entries = await fs.readdir(dirPath, { withFileTypes: true });
    for (const entry of entries) {
      if (entry.isFile()) {
        const ext = getExtension(entry.name);
        if (ext) extensions.push(ext);
      } else if (entry.isDirectory()) {
        const nested = await collectExtensions(path.join(dirPath, entry.name));
        extensions.push(...nested);
      }
    }
  } catch {
    // skip unreadable
  }
  return extensions;
}

function findDominantExtension(extensions: string[]): string {
  const counts = new Map<string, number>();
  for (const ext of extensions) {
    counts.set(ext, (counts.get(ext) ?? 0) + 1);
  }
  let maxExt = '';
  let maxCount = 0;
  for (const [ext, count] of counts) {
    if (count > maxCount) {
      maxCount = count;
      maxExt = ext;
    }
  }
  return maxExt;
}
