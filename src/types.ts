export interface SheldonifyConfig {
  strategy: StrategyName;
  depth: number;
  dryRun: boolean;
  verbose: boolean;
  jsonOutput: boolean;
  targetDir: string;
  configPath?: string;
  protected: ProtectedConfig;
  typeStrategy: TypeStrategyConfig;
  contextStrategy: ContextStrategyConfig;
  dateStrategy: DateStrategyConfig;
  customRules: CustomRule[];
}

export type StrategyName = 'type' | 'context' | 'date' | 'custom';

export interface ProtectedConfig {
  useDefaults: boolean;
  include: string[];
  exclude: string[];
}

export interface TypeStrategyConfig {
  extraMappings: Record<string, string>;
  categoryRenames: Record<string, string>;
}

export interface ContextStrategyConfig {
  extraKeywords: Record<string, string[]>;
}

export interface DateStrategyConfig {
  dateSource: 'modified' | 'created';
}

export interface CustomRule {
  name: string;
  match: {
    extensions?: string[];
    patterns?: string[];
    regex?: string;
  };
  priority?: number;
}

export interface FileEntry {
  absolutePath: string;
  relativePath: string;
  name: string;
  extension: string;
  size: number;
  modifiedAt: Date;
  createdAt: Date;
  hash?: string;
  isDirectory: boolean;
  media?: MediaMetadata;
  dominantExtension?: string;
}

export interface MediaMetadata {
  width?: number;
  height?: number;
  duration?: number;
  bitrate?: number;
}

export interface Classification {
  category: string;
  confidence: number;
  reason: string;
}

export interface MoveOperation {
  source: string;
  destination: string;
  reason: string;
  type: 'organize' | 'duplicate';
}

export interface DuplicateGroup {
  hash: string;
  kept: string;
  duplicates: string[];
}

export interface MovePlan {
  operations: MoveOperation[];
  duplicateGroups: DuplicateGroup[];
  skippedPaths: string[];
  uncertainFiles: UncertainFile[];
  warnings: string[];
  stats: PlanStats;
}

export interface UncertainFile {
  file: FileEntry;
  candidates: Classification[];
}

export interface PlanStats {
  totalFiles: number;
  filesToMove: number;
  duplicatesFound: number;
  foldersToCreate: number;
  protectedSkipped: number;
  uncertainCount: number;
}

export interface ExecutionResult {
  success: boolean;
  operationsExecuted: number;
  errors: string[];
  indexPath: string;
  undoShPath: string;
  undoPs1Path: string;
}

export interface SheldonifyIndex {
  version: number;
  timestamp: string;
  strategy: StrategyName;
  targetDir: string;
  stats: PlanStats;
  operations: MoveOperation[];
  undo: { from: string; to: string }[];
  uncertainResolutions: UncertainResolution[];
}

export interface UncertainResolution {
  file: string;
  options: string[];
  resolved: string;
  resolvedBy: 'user' | 'agent' | 'heuristic';
}

export interface SortStrategy {
  name: string;
  categorize(file: FileEntry, config: SheldonifyConfig): Classification;
}
