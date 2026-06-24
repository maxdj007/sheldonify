import chalk from 'chalk';
import { MovePlan, MoveOperation, ExecutionResult, SheldonifyConfig } from './types.js';
import path from 'node:path';

export function printDryRun(plan: MovePlan, config: SheldonifyConfig): void {
  if (config.jsonOutput) {
    printJson({ status: 'dry-run', plan: sanitizePlan(plan, config) });
    return;
  }

  const header = chalk.bold(`sheldonify — preview for ${chalk.cyan(config.targetDir)} using "${config.strategy}" strategy`);
  stderr(header);
  stderr('');

  if (plan.operations.length === 0) {
    stderr(chalk.yellow('  Nothing to do — directory is already organized.'));
    return;
  }

  const grouped = groupByDestFolder(plan.operations, config.targetDir);
  for (const [folder, ops] of Object.entries(grouped)) {
    stderr(chalk.green(`  📁 ${folder}/`));
    for (const op of ops) {
      const from = path.relative(config.targetDir, op.source);
      const to = path.relative(config.targetDir, op.destination);
      const icon = op.type === 'duplicate' ? chalk.yellow('⚠') : ' ';
      stderr(`  ${icon}  ${chalk.dim(from)} → ${chalk.white(to)}`);
    }
  }

  stderr('');
  stderr(chalk.bold('  Stats:'));
  stderr(`    Files to move:     ${plan.stats.filesToMove}`);
  stderr(`    Duplicates:        ${plan.stats.duplicatesFound}`);
  stderr(`    Folders to create: ${plan.stats.foldersToCreate}`);
  stderr(`    Protected skipped: ${plan.stats.protectedSkipped}`);
  if (plan.stats.uncertainCount > 0) {
    stderr(`    Uncertain:        ${chalk.yellow(plan.stats.uncertainCount.toString())}`);
  }
  stderr('');
  stderr(chalk.dim('  Run without --dry-run to apply.'));
}

export function printResult(result: ExecutionResult, config: SheldonifyConfig): void {
  if (config.jsonOutput) {
    printJson({
      status: result.success ? 'completed' : 'partial',
      operationsExecuted: result.operationsExecuted,
      errors: result.errors,
      indexPath: result.indexPath,
      undoShPath: result.undoShPath,
      undoPs1Path: result.undoPs1Path,
    });
    return;
  }

  if (result.success) {
    stderr(chalk.green.bold(`\n  ✓ Organized ${result.operationsExecuted} files successfully.`));
  } else {
    stderr(chalk.red.bold(`\n  ✗ Completed with ${result.errors.length} error(s).`));
    for (const err of result.errors) {
      stderr(chalk.red(`    • ${err}`));
    }
  }

  stderr(chalk.dim(`\n  Index: ${result.indexPath}`));
  stderr(chalk.dim(`  Undo:  ${result.undoShPath} (bash) / ${result.undoPs1Path} (powershell)`));
  stderr('');
}

export function printUncertainFiles(plan: MovePlan, config: SheldonifyConfig): void {
  if (config.jsonOutput) {
    printJson({
      status: 'needs-review',
      uncertainFiles: plan.uncertainFiles.map(u => ({
        file: u.file.relativePath,
        candidates: u.candidates.map(c => ({
          category: c.category,
          confidence: c.confidence,
          reason: c.reason,
        })),
      })),
    });
    return;
  }

  stderr(chalk.yellow.bold('\n  ⚠ The following files need your input:\n'));
  for (const uncertain of plan.uncertainFiles) {
    stderr(`  ${chalk.white(uncertain.file.relativePath)}`);
    for (const candidate of uncertain.candidates) {
      stderr(`    → ${chalk.cyan(candidate.category)} (${(candidate.confidence * 100).toFixed(0)}%: ${candidate.reason})`);
    }
    stderr('');
  }
}

export function printError(message: string, jsonOutput: boolean): void {
  if (jsonOutput) {
    printJson({ status: 'error', error: message });
  } else {
    stderr(chalk.red.bold(`\n  Error: ${message}\n`));
  }
}

export function printVerbose(message: string, config: SheldonifyConfig): void {
  if (config.verbose && !config.jsonOutput) {
    stderr(chalk.dim(`  [verbose] ${message}`));
  }
}

function printJson(data: unknown): void {
  process.stdout.write(JSON.stringify(data, null, 2) + '\n');
}

function stderr(message: string): void {
  process.stderr.write(message + '\n');
}

function groupByDestFolder(
  operations: MoveOperation[],
  targetDir: string
): Record<string, MoveOperation[]> {
  const groups: Record<string, MoveOperation[]> = {};
  for (const op of operations) {
    const rel = path.relative(targetDir, op.destination);
    const folder = rel.split(path.sep)[0] ?? 'root';
    if (!groups[folder]) groups[folder] = [];
    groups[folder].push(op);
  }
  return groups;
}

function sanitizePlan(plan: MovePlan, config: SheldonifyConfig) {
  return {
    stats: plan.stats,
    operations: plan.operations.map(op => ({
      from: path.relative(config.targetDir, op.source),
      to: path.relative(config.targetDir, op.destination),
      reason: op.reason,
      type: op.type,
    })),
    skippedPaths: plan.skippedPaths,
    warnings: plan.warnings,
  };
}
