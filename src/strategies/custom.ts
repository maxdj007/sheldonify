import { minimatch } from 'minimatch';
import { SortStrategy, FileEntry, SheldonifyConfig, Classification } from '../types.js';

export class CustomStrategy implements SortStrategy {
  name = 'custom';

  categorize(file: FileEntry, config: SheldonifyConfig): Classification {
    const rules = [...config.customRules].sort(
      (a, b) => (b.priority ?? 0) - (a.priority ?? 0)
    );

    for (const rule of rules) {
      if (this.matchesRule(file, rule)) {
        return {
          category: rule.name,
          confidence: 1.0,
          reason: `matched custom rule "${rule.name}"`,
        };
      }
    }

    return {
      category: 'Unsorted',
      confidence: 0.1,
      reason: 'no custom rules matched',
    };
  }

  private matchesRule(
    file: FileEntry,
    rule: { match: { extensions?: string[]; patterns?: string[]; regex?: string } }
  ): boolean {
    if (rule.match.extensions?.includes(file.extension)) return true;
    if (rule.match.patterns?.some(p => minimatch(file.name, p, { nocase: true }))) return true;
    if (rule.match.regex && new RegExp(rule.match.regex, 'i').test(file.relativePath)) return true;
    return false;
  }
}
