import fs from 'node:fs/promises';
import path from 'node:path';

import type { ChartData, PredictionResult, Subcategory } from '@/lib/api/predictions';

type RuleTradition = 'Bhrigu Samhita' | 'Nadi Jyotisha';

type FutureLivesMode = 'offline' | 'online' | 'hybrid';

export interface FutureLivesOptions {
  mode?: FutureLivesMode;
  useAI?: boolean;
  openAIApiKey?: string;
  aiModel?: string;
  temperature?: number;
  language?: string;
  maxProjections?: number;
  cacheTtlMs?: number;
}

interface WisdomRule {
  id: string;
  tradition: RuleTradition;
  text: string;
  tags: string[];
}

interface WisdomSources {
  rules: WisdomRule[];
  summaries: {
    bhrigu: string;
    nadi: string;
  };
  warnings: string[];
}

export interface FutureLivesProjection {
  title: string;
  narrative: string;
  alignmentScore: number;
  ruleRefs: WisdomRule[];
  choices: string[];
  focusAreas: string[];
}

interface PrecisionCheckResult {
  validated: FutureLivesProjection[];
  validationNotes: string[];
  recalibrated: boolean;
}

interface CacheEntry<T> {
  data: T;
  expiresAt: number;
}

const DEFAULT_CACHE_TTL = 10 * 60 * 1000;
const DEFAULT_MAX_PROJECTIONS = 3;
const RULE_CACHE = new Map<string, CacheEntry<WisdomSources>>();
const PREDICTION_CACHE = new Map<string, CacheEntry<PredictionResult>>();

const REMOTE_RULE_SOURCES = [
  'https://raw.githubusercontent.com/hisr2024/BhriguWelt/main/core_wisdom/nadi_jyotisha_rules.md',
  'https://raw.githubusercontent.com/hisr2024/BhriguWelt/main/core_wisdom/bhrigu_samhita_rules.md',
];

const PLANET_KEYWORDS = [
  'sun',
  'moon',
  'mars',
  'mercury',
  'jupiter',
  'venus',
  'saturn',
  'rahu',
  'ketu',
];

const SPIRITUAL_KEYWORDS = ['moksha', 'dharma', 'spiritual', 'liberation', 'yoga', 'meditation'];
const SERVICE_KEYWORDS = ['service', 'healing', 'charity', 'support', 'nurturing'];
const LEADERSHIP_KEYWORDS = ['leadership', 'authority', 'command', 'govern', 'influence'];
const TRANSFORMATION_KEYWORDS = ['transformation', 'rebirth', 'renewal', 'detachment', 'discipline'];

function isCacheValid(entry?: CacheEntry<unknown>): boolean {
  if (!entry) return false;
  return Date.now() < entry.expiresAt;
}

function normalizeText(text: string): string {
  return text.toLowerCase();
}

async function fileExists(filePath: string): Promise<boolean> {
  try {
    await fs.stat(filePath);
    return true;
  } catch {
    return false;
  }
}

async function resolveWisdomPath(fileName: string): Promise<string | null> {
  const candidates = [
    path.join(process.cwd(), 'core_wisdom', fileName),
    path.join(process.cwd(), 'frontend', 'core_wisdom', fileName),
    path.join(process.cwd(), '..', 'core_wisdom', fileName),
  ];

  for (const candidate of candidates) {
    if (await fileExists(candidate)) {
      return candidate;
    }
  }

  return null;
}

function extractRulesFromText(text: string, tradition: RuleTradition): WisdomRule[] {
  const ruleRegex = /\*\*Rule\s+([A-Z]{2}-\d{3})\*\*:\s*(.+)/g;
  const rules: WisdomRule[] = [];
  let match: RegExpExecArray | null;

  while ((match = ruleRegex.exec(text)) !== null) {
    const id = match[1];
    const ruleText = match[2].trim();
    rules.push({
      id,
      tradition,
      text: ruleText,
      tags: extractRuleTags(ruleText),
    });
  }

  return rules;
}

function extractRuleTags(text: string): string[] {
  const normalized = normalizeText(text);
  const tags = new Set<string>();

  if (SPIRITUAL_KEYWORDS.some(keyword => normalized.includes(keyword))) {
    tags.add('spiritual');
  }

  if (SERVICE_KEYWORDS.some(keyword => normalized.includes(keyword))) {
    tags.add('service');
  }

  if (LEADERSHIP_KEYWORDS.some(keyword => normalized.includes(keyword))) {
    tags.add('leadership');
  }

  if (TRANSFORMATION_KEYWORDS.some(keyword => normalized.includes(keyword))) {
    tags.add('transformation');
  }

  if (normalized.includes('marriage') || normalized.includes('spouse') || normalized.includes('partnership')) {
    tags.add('relationship');
  }

  if (normalized.includes('career') || normalized.includes('profession')) {
    tags.add('career');
  }

  if (normalized.includes('wealth') || normalized.includes('prosperity')) {
    tags.add('wealth');
  }

  if (normalized.includes('children') || normalized.includes('progeny')) {
    tags.add('legacy');
  }

  return Array.from(tags);
}

async function loadWisdomSources(cacheTtlMs: number): Promise<WisdomSources> {
  const cacheKey = 'future-lives-wisdom';
  const cached = RULE_CACHE.get(cacheKey);
  if (isCacheValid(cached)) {
    return cached!.data;
  }

  const warnings: string[] = [];
  const bhriguPath = await resolveWisdomPath('bhrigu_samhita_rules.md');
  const nadiPath = await resolveWisdomPath('nadi_jyotisha_rules.md');

  let bhriguText = '';
  let nadiText = '';

  if (bhriguPath) {
    bhriguText = await fs.readFile(bhriguPath, 'utf-8');
  } else {
    warnings.push('Bhrigu Samhita rules not found locally; attempting online sources.');
  }

  if (nadiPath) {
    nadiText = await fs.readFile(nadiPath, 'utf-8');
  } else {
    warnings.push('Nadi Jyotisha rules not found locally; attempting online sources.');
  }

  if (!bhriguText || !nadiText) {
    const remoteResults = await Promise.allSettled(
      REMOTE_RULE_SOURCES.map(async (url) => {
        const response = await fetch(url);
        if (!response.ok) {
          throw new Error(`Failed to fetch ${url}`);
        }
        return response.text();
      })
    );

    for (const result of remoteResults) {
      if (result.status === 'fulfilled') {
        if (result.value.includes('Bhrigu Samhita Rules')) {
          bhriguText = bhriguText || result.value;
        } else if (result.value.includes('Nadi Jyotisha Rules')) {
          nadiText = nadiText || result.value;
        }
      }
    }
  }

  if (!bhriguText) {
    warnings.push('Unable to load Bhrigu Samhita rules; using minimal fallback.');
    bhriguText = '## Bhrigu Samhita Rules\n\n**Rule BS-000**: Karma evolves through disciplined service, devotion, and mindful action.';
  }

  if (!nadiText) {
    warnings.push('Unable to load Nadi Jyotisha rules; using minimal fallback.');
    nadiText = '## Nadi Jyotisha Rules\n\n**Rule ND-000**: Nakshatra signatures reveal the soul’s future lessons through time cycles.';
  }

  const bhriguRules = extractRulesFromText(bhriguText, 'Bhrigu Samhita');
  const nadiRules = extractRulesFromText(nadiText, 'Nadi Jyotisha');

  const sources: WisdomSources = {
    rules: [...bhriguRules, ...nadiRules],
    summaries: {
      bhrigu: `Bhrigu Samhita: ${bhriguRules.length} rules parsed.`,
      nadi: `Nadi Jyotisha: ${nadiRules.length} rules parsed.`,
    },
    warnings,
  };

  RULE_CACHE.set(cacheKey, {
    data: sources,
    expiresAt: Date.now() + cacheTtlMs,
  });

  return sources;
}

function validateChartData(chartData: ChartData): string[] {
  const errors: string[] = [];

  if (!chartData.date_of_birth) {
    errors.push('Missing date_of_birth');
  }

  if (!chartData.zodiac_sign) {
    errors.push('Missing zodiac_sign');
  }

  if (!chartData.moon_sign) {
    errors.push('Missing moon_sign');
  }

  if (!chartData.ascendant) {
    errors.push('Missing ascendant');
  }

  return errors;
}

function buildChartKeywords(chartData: ChartData): string[] {
  const keywords = [
    chartData.nakshatra,
    chartData.zodiac_sign,
    chartData.moon_sign,
    chartData.ascendant,
  ].filter(Boolean) as string[];

  if (chartData.planets) {
    keywords.push(...Object.keys(chartData.planets));
  }

  return keywords.map(keyword => keyword.toLowerCase());
}

function scoreRuleMatch(rule: WisdomRule, chartData: ChartData): number {
  const normalizedRule = normalizeText(rule.text);
  const keywords = buildChartKeywords(chartData);
  let score = 0;

  for (const keyword of keywords) {
    if (normalizedRule.includes(keyword)) {
      score += 18;
    }
  }

  if (PLANET_KEYWORDS.some(planet => normalizedRule.includes(planet))) {
    score += 12;
  }

  if (normalizedRule.includes('dasha') || normalizedRule.includes('transit')) {
    score += 8;
  }

  if (rule.tags.includes('spiritual')) {
    score += 10;
  }

  return Math.min(score, 100);
}

function matchRules(chartData: ChartData, rules: WisdomRule[]): WisdomRule[] {
  return rules
    .map(rule => ({
      ...rule,
      alignmentScore: scoreRuleMatch(rule, chartData),
    }))
    .sort((a, b) => b.alignmentScore - a.alignmentScore)
    .slice(0, 18)
    .map(rule => ({
      id: rule.id,
      tradition: rule.tradition,
      text: rule.text,
      tags: rule.tags,
    }));
}

function buildProjectionNarrative(
  chartData: ChartData,
  focus: string,
  rules: WisdomRule[],
  alignmentScore: number
): string {
  const sign = chartData.zodiac_sign || 'your sign';
  const ascendant = chartData.ascendant || 'the ascendant';
  const nakshatra = chartData.nakshatra || 'your nakshatra';
  const ruleHighlights = rules.slice(0, 2).map(rule => `- ${rule.text}`).join('\n');

  return [
    `Drawing from ${focus} themes in ${nakshatra}, the soul’s trajectory echoes ${sign} resilience and ${ascendant} directionality.`,
    `Future-life momentum emphasizes ${focus}, aligning karmic choices with dharmic refinement.`,
    `Key sutras supporting this arc:\n${ruleHighlights || '- Wisdom texts emphasize steady karma alignment.'}`,
    `Alignment score: ${alignmentScore}/100 (higher means stronger Jyotisa coherence).`,
  ].join('\n');
}

function deriveChoices(focusAreas: string[]): string[] {
  const choices: Record<string, string[]> = {
    spiritual: [
      'Commit to daily sadhana practices that deepen inner clarity.',
      'Seek teachers or communities aligned with dharmic disciplines.',
    ],
    service: [
      'Choose service-driven roles that heal or uplift others.',
      'Offer structured charity aligned with planetary remedies.',
    ],
    leadership: [
      'Lead with integrity, mentoring others in long-term vision.',
      'Develop governance skills grounded in compassion.',
    ],
    transformation: [
      'Release outdated identities through disciplined rituals.',
      'Embrace cycles of renewal without clinging to outcomes.',
    ],
    relationship: [
      'Cultivate conscious partnership practices and vows.',
      'Balance autonomy with karmic partnerships.',
    ],
    career: [
      'Align vocation with soul-purpose rather than status alone.',
      'Develop mastery in a craft that honors lineage.',
    ],
    wealth: [
      'Build sustainable resource flows aligned to karmic ethics.',
      'Reinvest gains into community or knowledge.',
    ],
    legacy: [
      'Nurture future generations through teaching or mentoring.',
      'Create structures that preserve wisdom across births.',
    ],
  };

  return focusAreas.flatMap(area => choices[area] || []);
}

function buildFutureProjections(
  chartData: ChartData,
  matchedRules: WisdomRule[],
  maxProjections: number
): FutureLivesProjection[] {
  const focusBuckets: Record<string, WisdomRule[]> = {};

  for (const rule of matchedRules) {
    const focus = rule.tags[0] || 'spiritual';
    if (!focusBuckets[focus]) {
      focusBuckets[focus] = [];
    }
    focusBuckets[focus].push(rule);
  }

  const focusAreas = Object.keys(focusBuckets);
  const projections: FutureLivesProjection[] = [];

  for (const focus of focusAreas) {
    if (projections.length >= maxProjections) break;
    const rules = focusBuckets[focus];
    const alignmentScore = Math.round(
      rules.reduce((total, rule) => total + scoreRuleMatch(rule, chartData), 0) / rules.length
    );
    const narrative = buildProjectionNarrative(chartData, focus, rules, alignmentScore);
    const choices = deriveChoices([focus]);

    projections.push({
      title: `${focus.charAt(0).toUpperCase() + focus.slice(1)} Continuum`,
      narrative,
      alignmentScore,
      ruleRefs: rules.slice(0, 4),
      choices,
      focusAreas: [focus],
    });
  }

  if (projections.length === 0) {
    projections.push({
      title: 'Karmic Continuum',
      narrative: buildProjectionNarrative(chartData, 'spiritual', matchedRules, 62),
      alignmentScore: 62,
      ruleRefs: matchedRules.slice(0, 3),
      choices: deriveChoices(['spiritual', 'service']),
      focusAreas: ['spiritual', 'service'],
    });
  }

  return projections;
}

function precisionCheck(
  chartData: ChartData,
  projections: FutureLivesProjection[],
  matchedRules: WisdomRule[]
): PrecisionCheckResult {
  const validationNotes: string[] = [];
  const karmicIndicators = ['rahu', 'ketu', 'saturn'];
  const planetKeys = Object.keys(chartData.planets || {}).map(key => key.toLowerCase());
  const hasKarmicAxis = karmicIndicators.some(indicator => planetKeys.includes(indicator));

  if (!hasKarmicAxis) {
    validationNotes.push('Karmic axis markers (Rahu/Ketu/Saturn) are limited; interpretations remain symbolic.');
  } else {
    validationNotes.push('Karmic axis markers support reincarnation continuity checks.');
  }

  const validated = projections.map(projection => {
    const boostedScore = projection.alignmentScore + (hasKarmicAxis ? 5 : 0);
    return {
      ...projection,
      alignmentScore: Math.min(boostedScore, 100),
    };
  });

  const recalibrated = validated.some(projection => projection.alignmentScore < 60);
  if (recalibrated) {
    validationNotes.push('Precision check flagged low-alignment projections; recalibration applied.');
    const recalibratedProjections = buildFutureProjections(chartData, matchedRules, projections.length);
    return {
      validated: recalibratedProjections,
      validationNotes,
      recalibrated: true,
    };
  }

  validationNotes.push('Planetary alignment thresholds met for all projections.');

  return {
    validated,
    validationNotes,
    recalibrated: false,
  };
}

function buildSubcategories(
  projections: FutureLivesProjection[],
  precision: PrecisionCheckResult,
  sources: WisdomSources
): Record<string, Subcategory> {
  return {
    karmic_progression: {
      title: 'Karmic Progression',
      content: projections.map(projection => `${projection.title}\n${projection.narrative}`).join('\n\n'),
      data: projections,
    },
    future_paths: {
      title: 'Future-Life Pathways',
      content: projections
        .map(
          projection =>
            `${projection.title}:\n${projection.choices.map(choice => `- ${choice}`).join('\n')}`
        )
        .join('\n\n'),
      data: projections.map(projection => ({
        title: projection.title,
        choices: projection.choices,
        focusAreas: projection.focusAreas,
      })),
    },
    precision_check: {
      title: 'Jyotisa Precision Check',
      content: precision.validationNotes.join('\n'),
      data: {
        recalibrated: precision.recalibrated,
        alignmentScores: precision.validated.map(projection => ({
          title: projection.title,
          alignmentScore: projection.alignmentScore,
        })),
      },
    },
    soul_evolution: {
      title: 'Soul Evolution Summary',
      content: [
        `Sources: ${sources.summaries.bhrigu} ${sources.summaries.nadi}`,
        'Primary themes:',
        ...Array.from(
          new Set(projections.flatMap(projection => projection.focusAreas))
        ).map(theme => `- ${theme}`),
      ].join('\n'),
    },
    remedies: {
      title: 'Remedial Actions',
      content: [
        'Recommended remedies aligned to karma balance:',
        '- Morning Surya arghya to strengthen vitality and clarity.',
        '- Lunar mantra or journaling to stabilize emotional memory.',
        '- Service to elders or teachers on Saturdays for Saturn harmonization.',
      ].join('\n'),
    },
    validation: {
      title: 'Validation & Data Integrity',
      content: sources.warnings.length
        ? `Warnings:\n${sources.warnings.map(warning => `- ${warning}`).join('\n')}`
        : 'All wisdom sources loaded successfully.',
    },
  };
}

function buildChartSummary(chartData: ChartData): string {
  const planets = chartData.planets
    ? Object.entries(chartData.planets)
        .map(([planet, position]) => `${planet}: ${position.sign}`)
        .join(', ')
    : 'No planetary positions provided.';

  return [
    `Birth date: ${chartData.date_of_birth}`,
    `Zodiac: ${chartData.zodiac_sign}`,
    `Moon sign: ${chartData.moon_sign}`,
    `Ascendant: ${chartData.ascendant}`,
    `Nakshatra: ${chartData.nakshatra || 'Unknown'}`,
    `Planets: ${planets}`,
  ].join('\n');
}

async function generateAiSynthesis(
  chartData: ChartData,
  projections: FutureLivesProjection[],
  sources: WisdomSources,
  options: FutureLivesOptions
): Promise<string | undefined> {
  if (options.mode === 'offline' || options.useAI === false) {
    return undefined;
  }

  const apiKey = options.openAIApiKey || process.env.OPENAI_API_KEY;
  if (!apiKey) {
    return undefined;
  }

  const model = options.aiModel || 'gpt-4o-mini';
  const temperature = options.temperature ?? 0.4;
  const userPrompt = [
    'You are a Bhrigu Samhita + Nadi Jyotisha synthesis engine.',
    'Summarize future lives in two phases: generation and precision validation.',
    'Use symbolic language; avoid deterministic claims.',
    `Chart summary:\n${buildChartSummary(chartData)}`,
    `Wisdom sources: ${sources.summaries.bhrigu} ${sources.summaries.nadi}`,
    'Generated projections:',
    ...projections.map(projection => `- ${projection.title}: ${projection.narrative}`),
  ].join('\n\n');

  try {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model,
        temperature,
        messages: [
          {
            role: 'system',
            content:
              'You are an expert Jyotisa assistant grounding responses in Bhrigu Samhita and Nadi Jyotisha.',
          },
          { role: 'user', content: userPrompt },
        ],
      }),
    });

    if (!response.ok) {
      return undefined;
    }

    const data = (await response.json()) as {
      choices?: Array<{ message?: { content?: string } }>;
    };

    return data.choices?.[0]?.message?.content?.trim();
  } catch {
    return undefined;
  }
}

function buildCacheKey(chartData: ChartData, options: FutureLivesOptions): string {
  return JSON.stringify({
    date_of_birth: chartData.date_of_birth,
    time_of_birth: chartData.time_of_birth,
    place_of_birth: chartData.place_of_birth,
    zodiac_sign: chartData.zodiac_sign,
    moon_sign: chartData.moon_sign,
    ascendant: chartData.ascendant,
    nakshatra: chartData.nakshatra,
    planets: chartData.planets,
    mode: options.mode,
    useAI: options.useAI,
    language: options.language,
  });
}

export async function generateFutureLivesPrediction(
  chartData: ChartData,
  options: FutureLivesOptions = {}
): Promise<PredictionResult> {
  const cacheTtlMs = options.cacheTtlMs ?? DEFAULT_CACHE_TTL;
  const cacheKey = buildCacheKey(chartData, options);
  const cached = PREDICTION_CACHE.get(cacheKey);

  if (isCacheValid(cached)) {
    return cached!.data;
  }

  const validationErrors = validateChartData(chartData);
  if (validationErrors.length > 0) {
    return {
      engine: 'future_lives',
      title: 'Future Lives Prediction',
      success: false,
      subcategories: {},
      error: `Invalid chart data: ${validationErrors.join(', ')}`,
      generated_at: new Date().toISOString(),
      mode: options.mode || 'offline',
    };
  }

  const sources = await loadWisdomSources(cacheTtlMs);
  const matchedRules = matchRules(chartData, sources.rules);
  const projections = buildFutureProjections(
    chartData,
    matchedRules,
    options.maxProjections ?? DEFAULT_MAX_PROJECTIONS
  );
  const precision = precisionCheck(chartData, projections, matchedRules);
  const aiSynthesis = await generateAiSynthesis(chartData, precision.validated, sources, options);

  const result: PredictionResult = {
    engine: 'future_lives',
    title: 'Future Lives Prediction',
    success: true,
    subcategories: buildSubcategories(precision.validated, precision, sources),
    ai_synthesis: aiSynthesis,
    generated_at: new Date().toISOString(),
    mode: options.mode || 'offline',
    metadata: {
      engine: 'future_lives',
      zodiac_sign: chartData.zodiac_sign || 'Unknown',
      moon_sign: chartData.moon_sign || 'Unknown',
      ascendant: chartData.ascendant || 'Unknown',
      nakshatra: chartData.nakshatra || 'Unknown',
      ai_enhanced: Boolean(aiSynthesis),
      tradition: 'Bhrigu Samhita + Nadi Jyotisha',
      calculation_method: 'Two-phase projection (generation + precision check)',
    },
  };

  PREDICTION_CACHE.set(cacheKey, {
    data: result,
    expiresAt: Date.now() + cacheTtlMs,
  });

  return result;
}
