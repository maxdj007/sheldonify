import fs from 'node:fs/promises';
import path from 'node:path';
import os from 'node:os';

export async function createFixture(spec: Record<string, string>): Promise<string> {
  const tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), 'sheldonify-test-'));
  for (const [filePath, content] of Object.entries(spec)) {
    const fullPath = path.join(tmpDir, filePath);
    await fs.mkdir(path.dirname(fullPath), { recursive: true });
    await fs.writeFile(fullPath, content);
  }
  return tmpDir;
}

export async function cleanFixture(tmpDir: string): Promise<void> {
  await fs.rm(tmpDir, { recursive: true, force: true });
}

export async function listFiles(dir: string): Promise<string[]> {
  const results: string[] = [];
  await walkDir(dir, dir, results);
  return results.sort();
}

async function walkDir(current: string, root: string, results: string[]): Promise<void> {
  const entries = await fs.readdir(current, { withFileTypes: true });
  for (const entry of entries) {
    const full = path.join(current, entry.name);
    if (entry.isDirectory()) {
      await walkDir(full, root, results);
    } else {
      results.push(path.relative(root, full));
    }
  }
}

export async function readJson(filePath: string): Promise<unknown> {
  const raw = await fs.readFile(filePath, 'utf-8');
  return JSON.parse(raw);
}
