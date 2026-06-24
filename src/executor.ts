import fs from 'node:fs/promises';
import path from 'node:path';
import { MovePlan, MoveOperation, SheldonifyConfig, ExecutionResult, DuplicateGroup } from './types.js';
import { safeMove, ensureDir } from './utils/fs-helpers.js';
import { generateUndoSh, generateUndoPs1 } from './undo-generator.js';
import { generateIndex } from './index-generator.js';

export async function executePlan(
  plan: MovePlan,
  config: SheldonifyConfig
): Promise<ExecutionResult> {
  const errors: string[] = [];
  let operationsExecuted = 0;
  let aborted = false;
  const completedOps: MoveOperation[] = [];

  const onAbort = () => { aborted = true; };
  process.on('SIGINT', onAbort);
  process.on('SIGTERM', onAbort);

  try {
    // Create all target directories
    const dirs = new Set<string>();
    for (const op of plan.operations) {
      dirs.add(path.dirname(op.destination));
    }
    for (const dir of dirs) {
      await ensureDir(dir);
    }

    // Execute moves with progress
    const total = plan.operations.length;
    for (const op of plan.operations) {
      if (aborted) {
        errors.push('Aborted by user (SIGINT). Partial undo script generated.');
        break;
      }

      try {
        await safeMove(op.source, op.destination);
        completedOps.push(op);
        operationsExecuted++;

        if (!config.jsonOutput && total > 10 && operationsExecuted % 50 === 0) {
          process.stderr.write(`  Moving files... ${operationsExecuted}/${total}\r`);
        }
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : String(err);
        errors.push(`Failed to move ${op.source} → ${op.destination}: ${msg}`);
      }
    }

    if (!config.jsonOutput && total > 10) {
      process.stderr.write('\n');
    }

    // Write duplicate metadata sidecars
    if (!aborted) {
      for (const group of plan.duplicateGroups) {
        await writeDuplicateMetadata(group, config);
      }
    }

    // Generate undo scripts (always — even on abort, for completed operations)
    const opsForUndo = aborted ? completedOps : plan.operations;
    const undoSh = generateUndoSh(opsForUndo, config.targetDir);
    const undoPs1 = generateUndoPs1(opsForUndo, config.targetDir);
    const undoShPath = path.join(config.targetDir, '_sheldonify-undo.sh');
    const undoPs1Path = path.join(config.targetDir, '_sheldonify-undo.ps1');

    await fs.writeFile(undoShPath, undoSh, 'utf-8');
    await fs.writeFile(undoPs1Path, undoPs1, 'utf-8');

    // Generate index
    const partialPlan = aborted
      ? { ...plan, operations: completedOps }
      : plan;
    const index = generateIndex(partialPlan, config);
    const indexPath = path.join(config.targetDir, '_sheldonify-index.json');
    await fs.writeFile(indexPath, JSON.stringify(index, null, 2), 'utf-8');

    return {
      success: errors.length === 0,
      operationsExecuted,
      errors,
      indexPath,
      undoShPath,
      undoPs1Path,
    };
  } finally {
    process.removeListener('SIGINT', onAbort);
    process.removeListener('SIGTERM', onAbort);
  }
}

async function writeDuplicateMetadata(group: DuplicateGroup, config: SheldonifyConfig): Promise<void> {
  for (const dupPath of group.duplicates) {
    const dupRelPath = path.relative(config.targetDir, dupPath);
    const movedTo = path.join(config.targetDir, '_duplicates', dupRelPath);
    const metaPath = movedTo + '.sheldonify-meta.json';

    try {
      await ensureDir(path.dirname(metaPath));
      await fs.writeFile(metaPath, JSON.stringify({
        originalPath: dupRelPath,
        hash: group.hash,
        keptCopy: path.relative(config.targetDir, group.kept),
      }, null, 2), 'utf-8');
    } catch {
      // non-critical
    }
  }
}
