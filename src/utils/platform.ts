import path from 'node:path';

export function isWindows(): boolean {
  return process.platform === 'win32';
}

export function normalizePath(p: string): string {
  return p.split(path.sep).join('/');
}

export function getExtension(filename: string): string {
  const ext = path.extname(filename);
  return ext ? ext.slice(1).toLowerCase() : '';
}

export function getStem(filename: string): string {
  return path.basename(filename, path.extname(filename));
}
