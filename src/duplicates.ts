import { FileEntry, DuplicateGroup } from './types.js';
import { hashFile } from './utils/hash.js';

export async function findDuplicates(files: FileEntry[]): Promise<DuplicateGroup[]> {
  // Phase 1: group by size — unique sizes can't be duplicates
  const sizeGroups = new Map<number, FileEntry[]>();
  for (const file of files) {
    if (file.isDirectory) continue;
    const group = sizeGroups.get(file.size);
    if (group) {
      group.push(file);
    } else {
      sizeGroups.set(file.size, [file]);
    }
  }

  const duplicateGroups: DuplicateGroup[] = [];

  // Phase 2: hash files that share a size
  for (const group of sizeGroups.values()) {
    if (group.length < 2) continue;

    const hashGroups = new Map<string, FileEntry[]>();
    for (const file of group) {
      try {
        const hash = await hashFile(file.absolutePath);
        file.hash = hash;
        const hg = hashGroups.get(hash);
        if (hg) {
          hg.push(file);
        } else {
          hashGroups.set(hash, [file]);
        }
      } catch {
        // skip files we can't hash
      }
    }

    for (const [hash, hashGroup] of hashGroups) {
      if (hashGroup.length < 2) continue;

      // Keep the file with the shortest path; ties broken by earliest modification
      const sorted = [...hashGroup].sort((a, b) => {
        const pathDiff = a.relativePath.length - b.relativePath.length;
        if (pathDiff !== 0) return pathDiff;
        return a.modifiedAt.getTime() - b.modifiedAt.getTime();
      });

      const kept = sorted[0];
      const dupes = sorted.slice(1);

      duplicateGroups.push({
        hash,
        kept: kept.absolutePath,
        duplicates: dupes.map(d => d.absolutePath),
      });
    }
  }

  return duplicateGroups;
}
