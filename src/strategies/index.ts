import { SortStrategy, StrategyName } from '../types.js';
import { ByTypeStrategy } from './by-type.js';
import { ByDateStrategy } from './by-date.js';
import { ByContextStrategy } from './by-context.js';
import { CustomStrategy } from './custom.js';

const strategies: Record<StrategyName, () => SortStrategy> = {
  type: () => new ByTypeStrategy(),
  date: () => new ByDateStrategy(),
  context: () => new ByContextStrategy(),
  custom: () => new CustomStrategy(),
};

export function getStrategy(name: StrategyName): SortStrategy {
  const factory = strategies[name];
  if (!factory) {
    throw new Error(`Unknown strategy: ${name}`);
  }
  return factory();
}
