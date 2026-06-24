import path from 'node:path';
import { FileEntry, Classification, DuplicateGroup, UncertainFile, MovePlan, MoveOperation, SheldonifyConfig } from './types.js';
import { resolveConflict } from './utils/fs-helpers.js';

export function buildMovePlan(
  files: FileEntry[],
  classifications: Map<string, Classification>,
  duplicateGroups: DuplicateGroup[],
  uncertainFiles: UncertainFile[],
  config: SheldonifyConfig
): MovePlan {
  const operations: MoveOperation[] = [];
  const usedDests = new Set<string>();
  const duplicateSet = new Set<string>();
  const warnings: string[] = [];

  // Collect all duplicate file paths
  for (const group of duplicateGroups) {
    for (const dup of group.duplicates) {
      duplicateSet.add(dup);
    }
  }

  // Build organize operations from classifications
  for (const file of files) {
    if (duplicateSet.has(file.absolutePath)) continue;

    const classification = classifications.get(file.absolutePath);
    if (!classification) continue;

    const destDir = path.join(config.targetDir, classification.category);
    let destPath = path.join(destDir, file.name);

    // Skip if file is already in the right place (case-insensitive on Windows)
    if (path.dirname(file.absolutePath).toLowerCase() === destDir.toLowerCase()) continue;

    destPath = resolveConflict(destPath, usedDests);
    if (destPath.toLowerCase() === file.absolutePath.toLowerCase()) continue;
    usedDests.add(destPath);

    operations.push({
      source: file.absolutePath,
      destination: destPath,
      reason: classification.reason,
      type: 'organize',
    });
  }

  // Build duplicate move operations
  for (const group of duplicateGroups) {
    for (const dup of group.duplicates) {
      const dupFile = files.find(f => f.absolutePath === dup);
      if (!dupFile) continue;

      const dupRelPath = path.relative(config.targetDir, dup);
      if (dupRelPath.startsWith('_duplicates')) {
        warnings.push(`Skipping duplicate already in _duplicates: ${dupRelPath}`);
        continue;
      }
      let destPath = path.join(config.targetDir, '_duplicates', dupRelPath);
      destPath = resolveConflict(destPath, usedDests);
      usedDests.add(destPath);

      operations.push({
        source: dup,
        destination: destPath,
        reason: `duplicate of ${path.relative(config.targetDir, group.kept)}`,
        type: 'duplicate',
      });
    }
  }

  // Calculate folders to create
  const foldersToCreate = new Set<string>();
  for (const op of operations) {
    const dir = path.dirname(op.destination);
    if (dir !== config.targetDir) {
      foldersToCreate.add(dir);
    }
  }

  return {
    operations,
    duplicateGroups,
    skippedPaths: [],
    uncertainFiles,
    warnings,
    stats: {
      totalFiles: files.length,
      filesToMove: operations.filter(o => o.type === 'organize').length,
      duplicatesFound: duplicateGroups.reduce((sum, g) => sum + g.duplicates.length, 0),
      foldersToCreate: foldersToCreate.size,
      protectedSkipped: 0,
      uncertainCount: uncertainFiles.length,
    },
  };
}
