import fs from 'node:fs/promises';
import path from 'node:path';

export async function ensureDir(dirPath: string): Promise<void> {
  await fs.mkdir(dirPath, { recursive: true });
}

export async function safeMove(source: string, destination: string): Promise<void> {
  await ensureDir(path.dirname(destination));
  try {
    await fs.rename(source, destination);
  } catch (err: unknown) {
    if (isNodeError(err) && err.code === 'EXDEV') {
      await fs.copyFile(source, destination);
      await fs.unlink(source);
    } else {
      throw err;
    }
  }
}

export async function pathExists(p: string): Promise<boolean> {
  try {
    await fs.access(p);
    return true;
  } catch {
    return false;
  }
}

export async function isDirectory(p: string): Promise<boolean> {
  try {
    const stat = await fs.stat(p);
    return stat.isDirectory();
  } catch {
    return false;
  }
}

export function resolveConflict(destPath: string, existingDests: Set<string>): string {
  if (!existingDests.has(destPath)) return destPath;

  const dir = path.dirname(destPath);
  const ext = path.extname(destPath);
  const stem = path.basename(destPath, ext);
  let counter = 2;

  while (existingDests.has(path.join(dir, `${stem} (${counter})${ext}`))) {
    counter++;
  }
  return path.join(dir, `${stem} (${counter})${ext}`);
}

function isNodeError(err: unknown): err is NodeJS.ErrnoException {
  return err instanceof Error && 'code' in err;
}
