import { Command } from 'commander';
import { loadConfig } from './config.js';
import { scanDirectory, getScanWarnings } from './scanner.js';
import { createProtectedChecker } from './protected.js';
import { getStrategy } from './strategies/index.js';
import { classify } from './classifier.js';
import { findDuplicates } from './duplicates.js';
import { buildMovePlan } from './planner.js';
import { executePlan } from './executor.js';
import { printDryRun, printResult, printUncertainFiles, printError, printVerbose } from './output.js';
import { SheldonifyConfig, FileEntry, MovePlan } from './types.js';

const program = new Command()
  .name('sheldonify')
  .description('Organize files and folders by type, context, date, or custom rules')
  .version('0.1.0')
  .argument('[directory]', 'target directory to organize', '.')
  .option('-s, --strategy <name>', 'sorting strategy (type|context|date|custom)', 'type')
  .option('-d, --depth <number>', 'recursion depth', '1')
  .option('--dry-run', 'preview changes without executing')
  .option('--config <path>', 'path to config file')
  .option('--verbose', 'detailed output')
  .option('--json', 'structured JSON output for agents')
  .action(run);

program
  .command('scan <directory>')
  .description('Scan directory and output file metadata (for context strategy with LLM)')
  .option('-d, --depth <number>', 'recursion depth', '1')
  .option('--config <path>', 'path to config file')
  .option('--verbose', 'detailed output')
  .action(runScan);

program
  .command('apply <directory>')
  .description('Apply a classification plan from scan results')
  .option('--plan <path>', 'path to classification plan JSON')
  .option('--config <path>', 'path to config file')
  .option('--verbose', 'detailed output')
  .option('--json', 'structured JSON output for agents')
  .action(runApply);

async function run(directory: string, options: Record<string, string | boolean | undefined>): Promise<void> {
  try {
    const config = await loadConfig(directory, options);
    printVerbose(`Config loaded: strategy=${config.strategy}, depth=${config.depth}`, config);

    const isProtected = createProtectedChecker(config);
    printVerbose('Scanning directory...', config);

    const files = await scanDirectory(config.targetDir, config, isProtected);
    const warnings = getScanWarnings();
    printVerbose(`Found ${files.length} files`, config);
    if (warnings.symlinksSkipped.length > 0) {
      printVerbose(`Skipped ${warnings.symlinksSkipped.length} symlinks`, config);
    }

    if (files.length === 0) {
      printError('No files found to organize.', config.jsonOutput);
      process.exit(4);
    }

    const strategy = getStrategy(config.strategy);
    const { classifications, uncertainFiles } = classify(files, strategy, config);
    printVerbose(`Classified ${classifications.size} files, ${uncertainFiles.length} uncertain`, config);

    if (uncertainFiles.length > 0) {
      printUncertainFiles({ uncertainFiles, operations: [], duplicateGroups: [], skippedPaths: [], warnings: [], stats: { totalFiles: files.length, filesToMove: 0, duplicatesFound: 0, foldersToCreate: 0, protectedSkipped: 0, uncertainCount: uncertainFiles.length } }, config);
    }

    const duplicateGroups = await findDuplicates(files);
    printVerbose(`Found ${duplicateGroups.length} duplicate groups`, config);

    const plan = buildMovePlan(files, classifications, duplicateGroups, uncertainFiles, config);

    if (config.dryRun) {
      printDryRun(plan, config);
      process.exit(0);
    }

    const result = await executePlan(plan, config);
    printResult(result, config);
    process.exit(result.success ? 0 : 1);
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    printError(msg, options.json === true);
    process.exit(1);
  }
}

async function runScan(directory: string, options: Record<string, string | boolean | undefined>): Promise<void> {
  try {
    const config = await loadConfig(directory, {
      ...options,
      strategy: 'context',
      json: true,
    });

    const isProtected = createProtectedChecker(config);
    const files = await scanDirectory(config.targetDir, config, isProtected);

    const strategy = getStrategy('context');
    const { classifications, uncertainFiles } = classify(files, strategy, config);

    const output = {
      targetDir: config.targetDir,
      totalFiles: files.length,
      files: files.map(f => ({
        relativePath: f.relativePath,
        name: f.name,
        extension: f.extension,
        size: f.size,
        modifiedAt: f.modifiedAt.toISOString(),
        createdAt: f.createdAt.toISOString(),
        media: f.media,
        heuristicGuess: classifications.get(f.absolutePath) ?? null,
      })),
      uncertainFiles: uncertainFiles.map(u => ({
        file: u.file.relativePath,
        candidates: u.candidates,
      })),
    };

    process.stdout.write(JSON.stringify(output, null, 2) + '\n');
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    printError(msg, true);
    process.exit(1);
  }
}

async function runApply(directory: string, options: Record<string, string | boolean | undefined>): Promise<void> {
  try {
    if (!options.plan) {
      printError('--plan <path> is required for the apply command.', options.json === true);
      process.exit(2);
    }

    const config = await loadConfig(directory, {
      ...options,
      strategy: 'context',
    });

    const planPath = options.plan as string;
    const { readFile } = await import('node:fs/promises');
    const raw = await readFile(planPath, 'utf-8');
    const planData = JSON.parse(raw);

    const isProtected = createProtectedChecker(config);
    const files = await scanDirectory(config.targetDir, config, isProtected);

    const classifications = new Map<string, { category: string; confidence: number; reason: string }>();
    for (const entry of planData.classifications ?? []) {
      const file = files.find(f => f.relativePath === entry.file);
      if (file) {
        classifications.set(file.absolutePath, {
          category: entry.category,
          confidence: 1.0,
          reason: entry.reason ?? 'classified by agent',
        });
      }
    }

    const duplicateGroups = await findDuplicates(files);
    const plan = buildMovePlan(files, classifications, duplicateGroups, [], config);

    if (config.dryRun) {
      printDryRun(plan, config);
      process.exit(0);
    }

    const result = await executePlan(plan, config);
    printResult(result, config);
    process.exit(result.success ? 0 : 1);
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    printError(msg, options.json === true);
    process.exit(1);
  }
}

program.parse();
