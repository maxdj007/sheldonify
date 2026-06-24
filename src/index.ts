export { loadConfig } from './config.js';
export { scanDirectory, getScanWarnings } from './scanner.js';
export { createProtectedChecker, hasProjectMarker } from './protected.js';
export { getStrategy } from './strategies/index.js';
export { classify } from './classifier.js';
export { findDuplicates } from './duplicates.js';
export { buildMovePlan } from './planner.js';
export { executePlan } from './executor.js';
export { generateIndex } from './index-generator.js';
export { generateUndoSh, generateUndoPs1 } from './undo-generator.js';
export type {
  SheldonifyConfig,
  StrategyName,
  FileEntry,
  Classification,
  MoveOperation,
  MovePlan,
  DuplicateGroup,
  ExecutionResult,
  SheldonifyIndex,
  SortStrategy,
  CustomRule,
  UncertainFile,
  UncertainResolution,
  PlanStats,
} from './types.js';
