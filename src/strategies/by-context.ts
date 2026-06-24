import path from 'node:path';
import { SortStrategy, FileEntry, SheldonifyConfig, Classification } from '../types.js';

const CONTEXT_KEYWORDS: Record<string, string[]> = {
  'Screenshots':   ['screenshot', 'screen-shot', 'screen_shot', 'capture', 'snip', 'screenclip', 'screengrab'],
  'Receipts':      ['receipt', 'invoice', 'bill', 'payment', 'order-confirmation', 'order_confirmation'],
  'Resumes':       ['resume', 'cv', 'curriculum-vitae', 'curriculum_vitae', 'cover-letter', 'cover_letter', 'coverletter'],
  'Contracts':     ['contract', 'agreement', 'nda', 'terms', 'legal', 'memorandum'],
  'Presentations': ['presentation', 'slide', 'deck', 'pitch', 'keynote'],
  'Spreadsheets':  ['budget', 'expenses', 'financial', 'accounting', 'ledger', 'spreadsheet'],
  'Photos':        ['photo', 'selfie', 'portrait', 'headshot', 'img_', 'dsc_', 'dcim', 'pic_'],
  'Backups':       ['backup', 'bak', 'copy-of', 'copy_of', 'old-', 'old_', 'archive'],
  'Logs':          ['log', 'error-log', 'access-log', 'debug-log', 'crash'],
  'Config':        ['config', 'configuration', 'settings', 'preferences', 'env', 'rc'],
  'Templates':     ['template', 'boilerplate', 'scaffold', 'starter'],
  'Exports':       ['export', 'report', 'generated', 'output'],
  'Design':        ['mockup', 'wireframe', 'prototype', 'design', 'figma', 'sketch', 'comp'],
  'Notes':         ['note', 'memo', 'todo', 'draft', 'scratch', 'journal', 'diary'],
  'Downloads':     ['download', 'downloaded'],
};

const CONTEXTUAL_EXT_MAP: Record<string, string> = {
  jpg: 'Photos', jpeg: 'Photos', png: 'Photos', gif: 'Photos',
  heic: 'Photos', raw: 'Photos',
  pdf: 'Documents', doc: 'Documents', docx: 'Documents', txt: 'Documents',
  xls: 'Spreadsheets', xlsx: 'Spreadsheets', csv: 'Spreadsheets',
  ppt: 'Presentations', pptx: 'Presentations',
  mp4: 'Videos', avi: 'Videos', mkv: 'Videos', mov: 'Videos',
  mp3: 'Music', wav: 'Music', flac: 'Music',
  zip: 'Archives', rar: 'Archives', '7z': 'Archives', tar: 'Archives',
  exe: 'Installers', msi: 'Installers', dmg: 'Installers',
  psd: 'Design', ai: 'Design', sketch: 'Design', fig: 'Design',
};

export class ByContextStrategy implements SortStrategy {
  name = 'context';

  categorize(file: FileEntry, config: SheldonifyConfig): Classification {
    const parentMatch = this.matchParentFolder(file);
    if (parentMatch) return parentMatch;

    const allKeywords = { ...CONTEXT_KEYWORDS };
    for (const [category, keywords] of Object.entries(config.contextStrategy.extraKeywords)) {
      allKeywords[category] = [...(allKeywords[category] ?? []), ...keywords];
    }

    const keywordMatch = this.matchKeywords(file.name, allKeywords);
    if (keywordMatch) return keywordMatch;

    const extMatch = this.matchExtension(file.extension);
    if (extMatch) return extMatch;

    return {
      category: 'Unsorted',
      confidence: 0.1,
      reason: 'no context signals found',
    };
  }

  private matchParentFolder(file: FileEntry): Classification | null {
    const parts = file.relativePath.split(path.sep);
    if (parts.length < 2) return null;

    const parentName = parts[parts.length - 2].toLowerCase();

    for (const [category, keywords] of Object.entries(CONTEXT_KEYWORDS)) {
      if (keywords.some(k => parentName.includes(k)) || parentName === category.toLowerCase()) {
        return {
          category,
          confidence: 0.9,
          reason: `parent folder "${parts[parts.length - 2]}" matches ${category}`,
        };
      }
    }
    return null;
  }

  private matchKeywords(filename: string, keywords: Record<string, string[]>): Classification | null {
    const lowerName = filename.toLowerCase();
    const matches: Classification[] = [];

    for (const [category, patterns] of Object.entries(keywords)) {
      for (const pattern of patterns) {
        if (lowerName.includes(pattern.toLowerCase())) {
          matches.push({
            category,
            confidence: 0.8,
            reason: `filename contains "${pattern}"`,
          });
          break;
        }
      }
    }

    if (matches.length === 1) return matches[0];
    if (matches.length > 1) {
      // multiple matches — return the first but lower confidence
      return { ...matches[0], confidence: 0.4 };
    }
    return null;
  }

  private matchExtension(ext: string): Classification | null {
    const category = CONTEXTUAL_EXT_MAP[ext];
    if (category) {
      return {
        category,
        confidence: 0.5,
        reason: `extension .${ext} suggests ${category}`,
      };
    }
    return null;
  }
}
