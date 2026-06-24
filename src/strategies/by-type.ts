import { SortStrategy, FileEntry, SheldonifyConfig, Classification } from '../types.js';

const TYPE_MAP: Record<string, string> = {
  // Images
  jpg: 'Images', jpeg: 'Images', png: 'Images', gif: 'Images',
  svg: 'Images', webp: 'Images', bmp: 'Images', ico: 'Images',
  tiff: 'Images', raw: 'Images', heic: 'Images', avif: 'Images',

  // Documents
  pdf: 'Documents', doc: 'Documents', docx: 'Documents',
  txt: 'Documents', rtf: 'Documents', odt: 'Documents',
  xls: 'Documents', xlsx: 'Documents', csv: 'Documents',
  ppt: 'Documents', pptx: 'Documents', odp: 'Documents',
  ods: 'Documents', pages: 'Documents', numbers: 'Documents',
  keynote: 'Documents',

  // Code
  ts: 'Code', tsx: 'Code', js: 'Code', jsx: 'Code',
  py: 'Code', rs: 'Code', go: 'Code',
  java: 'Code', c: 'Code', cpp: 'Code', h: 'Code', hpp: 'Code',
  cs: 'Code', rb: 'Code', php: 'Code', swift: 'Code', kt: 'Code',
  html: 'Code', css: 'Code', scss: 'Code', less: 'Code', sass: 'Code',
  json: 'Code', yaml: 'Code', yml: 'Code', toml: 'Code',
  xml: 'Code', sql: 'Code', sh: 'Code', ps1: 'Code', bat: 'Code',
  md: 'Code', r: 'Code', lua: 'Code', dart: 'Code', vue: 'Code',
  svelte: 'Code', zig: 'Code', ex: 'Code', exs: 'Code',

  // Videos
  mp4: 'Videos', avi: 'Videos', mkv: 'Videos', mov: 'Videos',
  wmv: 'Videos', flv: 'Videos', webm: 'Videos', m4v: 'Videos',

  // Audio
  mp3: 'Audio', wav: 'Audio', flac: 'Audio', aac: 'Audio',
  ogg: 'Audio', wma: 'Audio', m4a: 'Audio', opus: 'Audio',

  // Archives
  zip: 'Archives', tar: 'Archives', gz: 'Archives', rar: 'Archives',
  '7z': 'Archives', bz2: 'Archives', xz: 'Archives', zst: 'Archives',

  // Fonts
  ttf: 'Fonts', otf: 'Fonts', woff: 'Fonts', woff2: 'Fonts', eot: 'Fonts',

  // Executables & Installers
  exe: 'Executables', msi: 'Executables', dmg: 'Executables',
  deb: 'Executables', rpm: 'Executables', appimage: 'Executables',
  apk: 'Executables', ipa: 'Executables',

  // Data
  db: 'Data', sqlite: 'Data', sqlite3: 'Data', mdb: 'Data',
  parquet: 'Data', arrow: 'Data', avro: 'Data',

  // Design
  psd: 'Design', ai: 'Design', sketch: 'Design', fig: 'Design',
  xd: 'Design', indd: 'Design',
};

export class ByTypeStrategy implements SortStrategy {
  name = 'type';

  categorize(file: FileEntry, config: SheldonifyConfig): Classification {
    const ext = file.extension;
    const renames = config.typeStrategy.categoryRenames;
    const extra = config.typeStrategy.extraMappings;

    let category = extra[ext] ?? TYPE_MAP[ext];

    if (!category) {
      category = ext ? 'Other' : 'Misc';
    }

    if (renames[category]) {
      category = renames[category];
    }

    return {
      category,
      confidence: 1.0,
      reason: ext ? `extension: .${ext} → ${category}` : `no extension → ${category}`,
    };
  }
}
