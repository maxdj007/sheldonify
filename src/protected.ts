import path from 'node:path';
import fs from 'node:fs/promises';
import { SheldonifyConfig } from './types.js';

const DEFAULT_PROTECTED_NAMES = new Set([
  '.git', '.svn', '.hg',
  'node_modules', '.venv', 'venv', '__pycache__',
  '.idea', '.vscode', '.vs', '.eclipse',
  'vendor', 'bower_components',
  '.terraform', '.serverless',
  '.next', '.nuxt', '.svelte-kit',
  '_duplicates',
]);

const DEFAULT_PROTECTED_PREFIXES = [
  '_sheldonify-',
];

const PROJECT_MARKERS = [
  'package.json', 'Cargo.toml', 'go.mod', 'pyproject.toml',
  'setup.py', 'Gemfile', 'pom.xml', 'build.gradle',
  'CMakeLists.txt', 'Makefile', 'composer.json', 'mix.exs',
  'stack.yaml', 'dune-project', 'pubspec.yaml',
];

const PROJECT_MARKER_GLOBS = ['.sln', '.csproj', '.fsproj'];

export function createProtectedChecker(config: SheldonifyConfig): (absPath: string) => boolean {
  const cache = new Map<string, boolean>();

  const excludeSet = new Set(config.protected.exclude);
  const includeSet = new Set(config.protected.include);

  return function isProtected(absPath: string): boolean {
    const cached = cache.get(absPath);
    if (cached !== undefined) return cached;

    const name = path.basename(absPath);
    let result = false;

    if (includeSet.has(name)) {
      result = true;
    } else if (excludeSet.has(name)) {
      result = false;
    } else if (config.protected.useDefaults) {
      result = checkDefaults(name);
    }

    cache.set(absPath, result);
    return result;
  };
}

function checkDefaults(name: string): boolean {
  if (DEFAULT_PROTECTED_NAMES.has(name)) return true;
  if (name.startsWith('.')) return true;
  for (const prefix of DEFAULT_PROTECTED_PREFIXES) {
    if (name.startsWith(prefix)) return true;
  }
  return false;
}

export async function hasProjectMarker(dirPath: string): Promise<boolean> {
  try {
    const entries = await fs.readdir(dirPath);
    for (const entry of entries) {
      if (PROJECT_MARKERS.includes(entry)) return true;
      for (const glob of PROJECT_MARKER_GLOBS) {
        if (entry.endsWith(glob)) return true;
      }
    }
  } catch {
    // can't read directory — treat as protected to be safe
    return true;
  }
  return false;
}
