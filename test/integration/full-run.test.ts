import { describe, it, expect, afterEach } from 'vitest';
import path from 'node:path';
import { createFixture, cleanFixture, listFiles, readJson } from '../helpers.js';
import { loadConfig } from '../../src/config.js';
import { scanDirectory } from '../../src/scanner.js';
import { createProtectedChecker } from '../../src/protected.js';
import { getStrategy } from '../../src/strategies/index.js';
import { classify } from '../../src/classifier.js';
import { findDuplicates } from '../../src/duplicates.js';
import { buildMovePlan } from '../../src/planner.js';
import { executePlan } from '../../src/executor.js';
import { SheldonifyIndex } from '../../src/types.js';

let tmpDir: string;

afterEach(async () => {
  if (tmpDir) await cleanFixture(tmpDir);
});

describe('full run — type strategy', () => {
  it('organizes files by extension', async () => {
    tmpDir = await createFixture({
      'photo.jpg': 'image data',
      'report.pdf': 'pdf data',
      'app.ts': 'code data',
      'song.mp3': 'audio data',
    });

    const config = await loadConfig(tmpDir, { strategy: 'type' });
    const isProtected = createProtectedChecker(config);
    const files = await scanDirectory(config.targetDir, config, isProtected);
    const strategy = getStrategy('type');
    const { classifications, uncertainFiles } = classify(files, strategy, config);
    const duplicateGroups = await findDuplicates(files);
    const plan = buildMovePlan(files, classifications, duplicateGroups, uncertainFiles, config);
    const result = await executePlan(plan, config);

    expect(result.success).toBe(true);
    expect(result.operationsExecuted).toBe(4);

    const fileList = await listFiles(tmpDir);
    expect(fileList).toContain(path.join('Images', 'photo.jpg'));
    expect(fileList).toContain(path.join('Documents', 'report.pdf'));
    expect(fileList).toContain(path.join('Code', 'app.ts'));
    expect(fileList).toContain(path.join('Audio', 'song.mp3'));
  });

  it('generates valid index file', async () => {
    tmpDir = await createFixture({
      'photo.jpg': 'image data',
      'report.pdf': 'pdf data',
    });

    const config = await loadConfig(tmpDir, { strategy: 'type' });
    const isProtected = createProtectedChecker(config);
    const files = await scanDirectory(config.targetDir, config, isProtected);
    const strategy = getStrategy('type');
    const { classifications, uncertainFiles } = classify(files, strategy, config);
    const duplicateGroups = await findDuplicates(files);
    const plan = buildMovePlan(files, classifications, duplicateGroups, uncertainFiles, config);
    await executePlan(plan, config);

    const index = await readJson(path.join(tmpDir, '_sheldonify-index.json')) as SheldonifyIndex;
    expect(index.version).toBe(1);
    expect(index.strategy).toBe('type');
    expect(index.stats.filesToMove).toBe(2);
    expect(index.operations).toHaveLength(2);
    expect(index.undo).toHaveLength(2);
  });

  it('handles duplicates', async () => {
    tmpDir = await createFixture({
      'photo.jpg': 'same content',
      'photo_copy.jpg': 'same content',
      'unique.png': 'different content',
    });

    const config = await loadConfig(tmpDir, { strategy: 'type' });
    const isProtected = createProtectedChecker(config);
    const files = await scanDirectory(config.targetDir, config, isProtected);
    const strategy = getStrategy('type');
    const { classifications, uncertainFiles } = classify(files, strategy, config);
    const duplicateGroups = await findDuplicates(files);
    const plan = buildMovePlan(files, classifications, duplicateGroups, uncertainFiles, config);
    const result = await executePlan(plan, config);

    expect(result.success).toBe(true);
    expect(plan.stats.duplicatesFound).toBe(1);

    const fileList = await listFiles(tmpDir);
    const dupFiles = fileList.filter(f => f.startsWith('_duplicates') && !f.endsWith('.sheldonify-meta.json'));
    expect(dupFiles.length).toBe(1);
  });

  it('skips protected directories', async () => {
    tmpDir = await createFixture({
      'photo.jpg': 'image data',
      '.git/config': 'git config',
      'node_modules/package/index.js': 'module code',
    });

    const config = await loadConfig(tmpDir, { strategy: 'type' });
    const isProtected = createProtectedChecker(config);
    const files = await scanDirectory(config.targetDir, config, isProtected);

    expect(files).toHaveLength(1);
    expect(files[0].name).toBe('photo.jpg');
  });

  it('resolves naming conflicts', async () => {
    tmpDir = await createFixture({
      'report.pdf': 'first report',
      'subdir/report.pdf': 'second report',
    });

    const config = await loadConfig(tmpDir, { strategy: 'type', depth: '2' });
    const isProtected = createProtectedChecker(config);
    const files = await scanDirectory(config.targetDir, config, isProtected);
    const strategy = getStrategy('type');
    const { classifications, uncertainFiles } = classify(files, strategy, config);
    const duplicateGroups = await findDuplicates(files);
    const plan = buildMovePlan(files, classifications, duplicateGroups, uncertainFiles, config);
    const result = await executePlan(plan, config);

    expect(result.success).toBe(true);
    const fileList = await listFiles(tmpDir);
    const docFiles = fileList.filter(f => f.startsWith('Documents'));
    expect(docFiles).toHaveLength(2);
  });
});

describe('full run — date strategy', () => {
  it('organizes files by modification date', async () => {
    tmpDir = await createFixture({
      'photo.jpg': 'image data',
      'report.pdf': 'pdf data',
    });

    const config = await loadConfig(tmpDir, { strategy: 'date' });
    const isProtected = createProtectedChecker(config);
    const files = await scanDirectory(config.targetDir, config, isProtected);
    const strategy = getStrategy('date');
    const { classifications, uncertainFiles } = classify(files, strategy, config);
    const duplicateGroups = await findDuplicates(files);
    const plan = buildMovePlan(files, classifications, duplicateGroups, uncertainFiles, config);
    const result = await executePlan(plan, config);

    expect(result.success).toBe(true);
    const fileList = await listFiles(tmpDir);
    const yearDirs = fileList.filter(f => f.match(/^\d{4}/));
    expect(yearDirs.length).toBeGreaterThan(0);
  });
});

describe('full run — context strategy', () => {
  it('classifies files by filename keywords', async () => {
    tmpDir = await createFixture({
      'screenshot_2024.png': 'screenshot data',
      'my_resume.pdf': 'resume data',
      'invoice_jan.pdf': 'invoice data',
    });

    const config = await loadConfig(tmpDir, { strategy: 'context' });
    const isProtected = createProtectedChecker(config);
    const files = await scanDirectory(config.targetDir, config, isProtected);
    const strategy = getStrategy('context');
    const { classifications } = classify(files, strategy, config);

    const categories = new Map<string, string>();
    for (const [absPath, cls] of classifications) {
      const name = path.basename(absPath);
      categories.set(name, cls.category);
    }

    expect(categories.get('screenshot_2024.png')).toBe('Screenshots');
    expect(categories.get('my_resume.pdf')).toBe('Resumes');
    expect(categories.get('invoice_jan.pdf')).toBe('Receipts');
  });
});
