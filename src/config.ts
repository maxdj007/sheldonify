import { z } from 'zod';
import fs from 'node:fs/promises';
import path from 'node:path';
import { SheldonifyConfig, StrategyName } from './types.js';

const CustomRuleSchema = z.object({
  name: z.string(),
  match: z.object({
    extensions: z.array(z.string()).optional(),
    patterns: z.array(z.string()).optional(),
    regex: z.string().optional(),
  }),
  priority: z.number().optional(),
});

const ConfigFileSchema = z.object({
  strategy: z.enum(['type', 'context', 'date', 'custom']).optional(),
  depth: z.number().int().min(1).optional(),
  protected: z.object({
    useDefaults: z.boolean().optional(),
    include: z.array(z.string()).optional(),
    exclude: z.array(z.string()).optional(),
  }).optional(),
  typeStrategy: z.object({
    extraMappings: z.record(z.string()).optional(),
    categoryRenames: z.record(z.string()).optional(),
  }).optional(),
  contextStrategy: z.object({
    extraKeywords: z.record(z.array(z.string())).optional(),
  }).optional(),
  dateStrategy: z.object({
    dateSource: z.enum(['modified', 'created']).optional(),
  }).optional(),
  customRules: z.array(CustomRuleSchema).optional(),
});

type ConfigFile = z.infer<typeof ConfigFileSchema>;

const DEFAULTS: SheldonifyConfig = {
  strategy: 'type',
  depth: 1,
  dryRun: false,
  verbose: false,
  jsonOutput: false,
  targetDir: '.',
  protected: {
    useDefaults: true,
    include: [],
    exclude: [],
  },
  typeStrategy: {
    extraMappings: {},
    categoryRenames: {},
  },
  contextStrategy: {
    extraKeywords: {},
  },
  dateStrategy: {
    dateSource: 'modified',
  },
  customRules: [],
};

export async function loadConfig(
  targetDir: string,
  cliOptions: {
    strategy?: string;
    depth?: string;
    dryRun?: boolean;
    verbose?: boolean;
    json?: boolean;
    config?: string;
  }
): Promise<SheldonifyConfig> {
  const configFile = await findAndParseConfig(targetDir, cliOptions.config);

  const config: SheldonifyConfig = {
    ...DEFAULTS,
    targetDir: path.resolve(targetDir),
    strategy: (cliOptions.strategy ?? configFile?.strategy ?? DEFAULTS.strategy) as StrategyName,
    depth: cliOptions.depth ? parseInt(cliOptions.depth, 10) : (configFile?.depth ?? DEFAULTS.depth),
    dryRun: cliOptions.dryRun ?? DEFAULTS.dryRun,
    verbose: cliOptions.verbose ?? DEFAULTS.verbose,
    jsonOutput: cliOptions.json ?? DEFAULTS.jsonOutput,
    protected: {
      useDefaults: configFile?.protected?.useDefaults ?? DEFAULTS.protected.useDefaults,
      include: configFile?.protected?.include ?? DEFAULTS.protected.include,
      exclude: configFile?.protected?.exclude ?? DEFAULTS.protected.exclude,
    },
    typeStrategy: {
      extraMappings: configFile?.typeStrategy?.extraMappings ?? DEFAULTS.typeStrategy.extraMappings,
      categoryRenames: configFile?.typeStrategy?.categoryRenames ?? DEFAULTS.typeStrategy.categoryRenames,
    },
    contextStrategy: {
      extraKeywords: configFile?.contextStrategy?.extraKeywords ?? DEFAULTS.contextStrategy.extraKeywords,
    },
    dateStrategy: {
      dateSource: configFile?.dateStrategy?.dateSource ?? DEFAULTS.dateStrategy.dateSource,
    },
    customRules: configFile?.customRules ?? DEFAULTS.customRules,
  };

  return config;
}

async function findAndParseConfig(
  targetDir: string,
  explicitPath?: string
): Promise<ConfigFile | null> {
  const candidates = explicitPath
    ? [path.resolve(explicitPath)]
    : [
        path.join(path.resolve(targetDir), 'sheldonify.config.json'),
        path.join(homedir(), 'sheldonify.config.json'),
      ];

  for (const candidate of candidates) {
    try {
      const raw = await fs.readFile(candidate, 'utf-8');
      const parsed = JSON.parse(raw);
      const validated = ConfigFileSchema.parse(parsed);
      return validated;
    } catch (err: unknown) {
      if (err instanceof z.ZodError) {
        const issues = err.issues.map(i => `  ${i.path.join('.')}: ${i.message}`).join('\n');
        throw new Error(`Invalid config file ${candidate}:\n${issues}`);
      }
      if (isNodeError(err) && err.code === 'ENOENT') {
        continue;
      }
      if (explicitPath) {
        throw new Error(`Failed to read config file ${candidate}: ${err}`);
      }
    }
  }

  return null;
}

function homedir(): string {
  return process.env.HOME ?? process.env.USERPROFILE ?? '';
}

function isNodeError(err: unknown): err is NodeJS.ErrnoException {
  return err instanceof Error && 'code' in err;
}
