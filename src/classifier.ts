import { FileEntry, SheldonifyConfig, Classification, SortStrategy, UncertainFile } from './types.js';

const CONFIDENCE_THRESHOLD = 0.5;

export interface ClassifyResult {
  classifications: Map<string, Classification>;
  uncertainFiles: UncertainFile[];
}

export function classify(
  files: FileEntry[],
  strategy: SortStrategy,
  config: SheldonifyConfig
): ClassifyResult {
  const classifications = new Map<string, Classification>();
  const uncertainFiles: UncertainFile[] = [];

  for (const file of files) {
    const result = strategy.categorize(file, config);

    if (result.confidence >= CONFIDENCE_THRESHOLD) {
      classifications.set(file.absolutePath, result);
    } else {
      uncertainFiles.push({
        file,
        candidates: [result],
      });
    }
  }

  return { classifications, uncertainFiles };
}
