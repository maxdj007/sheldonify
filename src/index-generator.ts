import path from 'node:path';
import { MovePlan, SheldonifyConfig, SheldonifyIndex, UncertainResolution } from './types.js';

export function generateIndex(
  plan: MovePlan,
  config: SheldonifyConfig,
  uncertainResolutions: UncertainResolution[] = []
): SheldonifyIndex {
  return {
    version: 1,
    timestamp: new Date().toISOString(),
    strategy: config.strategy,
    targetDir: config.targetDir,
    stats: plan.stats,
    operations: plan.operations.map(op => ({
      source: path.relative(config.targetDir, op.source),
      destination: path.relative(config.targetDir, op.destination),
      reason: op.reason,
      type: op.type,
    })),
    undo: plan.operations.map(op => ({
      from: path.relative(config.targetDir, op.destination),
      to: path.relative(config.targetDir, op.source),
    })),
    uncertainResolutions,
  };
}
