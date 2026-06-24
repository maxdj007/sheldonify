import { SortStrategy, FileEntry, SheldonifyConfig, Classification } from '../types.js';

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

export class ByDateStrategy implements SortStrategy {
  name = 'date';

  categorize(file: FileEntry, config: SheldonifyConfig): Classification {
    const date = config.dateStrategy.dateSource === 'created'
      ? file.createdAt
      : file.modifiedAt;

    const year = date.getFullYear().toString();
    const monthIndex = date.getMonth();
    const monthNum = String(monthIndex + 1).padStart(2, '0');
    const monthName = MONTH_NAMES[monthIndex];

    const category = `${year}/${monthNum}-${monthName}`;

    return {
      category,
      confidence: 1.0,
      reason: `${config.dateStrategy.dateSource} date: ${date.toISOString().split('T')[0]}`,
    };
  }
}
