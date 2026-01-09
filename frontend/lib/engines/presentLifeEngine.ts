import 'server-only';

import fs from 'node:fs/promises';
import path from 'node:path';

import type { ChartData, PredictionResult, Subcategory } from '@/lib/api/predictions';

type PresentLifeMode = 'offline' | 'online' | 'hybrid';

type RuleTradition = 'Bhrigu Samhita' | 'Nadi Jyotisha' | 'Bhrigu Samhita Codex';

export interface PresentLifeOptions {
  mode?: PresentLifeMode;
  useAI?: boolean;
  openAIApiKey?: string;
  aiModel?: string;
  temperature?: number;
  language?: string;
  cacheTtlMs?: number;
}

interface PresentLifeRule {
  id: string;
  tradition: RuleTradition;
  text: string;
  tags: string[];
  weight?: number;
  source?: string;
}

interface WisdomSources {
  rules: PresentLifeRule[];
  summaries: string[];
  warnings: string[];
}

interface PresentLifeProfile {
  overview: string;
  strengths: string[];
  challenges: string[];
  focusAreas: string[];
  dashaTheme: string;
  supportingRules: PresentLifeRule[];
}

interface PrecisionCheckResult {
  adjustedOverview: string;
  notes: string[];
  balanceScore: number;
  validatedFocus: string[];
}

interface CacheEntry<T> {
  data: T;
  expiresAt: number;
}

const DEFAULT_CACHE_TTL = 10 * 60 * 1000;

const RULE_CACHE = new Map<string, CacheEntry<WisdomSources>>();
const PREDICTION_CACHE = new Map<string, CacheEntry<PredictionResult>>();

const REMOTE_RULE_SOURCES = [
  'https://raw.githubusercontent.com/hisr2024/BhriguWelt/main/core_wisdom/bhrigu_samhita_rules.md',
  'https://raw.githubusercontent.com/hisr2024/BhriguWelt/main/core_wisdom/nadi_jyotisha_rules.md',
  'https://raw.githubusercontent.com/hisr2024/BhriguWelt/main/docs/bhrigu_samhita_jyotish_engine.md',
  'https://raw.githubusercontent.com/hisr2024/BhriguWelt/main/backend/data/bhrigu_samhita_principles.yml',
];

const PRESENT_LIFE_BASE_RULES: PresentLifeRule[] = [
  {
    id: 'PL-BASE-1',
    tradition: 'Bhrigu Samhita',
    text: 'Moon anchors the mind and emotional tone in this life, shaping present strengths and sensitivities.',
    tags: ['mind', 'emotions', 'moon'],
  },
  {
    id: 'PL-BASE-2',
    tradition: 'Bhrigu Samhita',
    text: 'Mars reveals drive and courage, clarifying where action and discipline are required today.',
    tags: ['drive', 'mars', 'discipline'],
  },
  {
    id: 'PL-BASE-3',
    tradition: 'Bhrigu Samhita',
    text: 'Mercury refines learning, communication, and trade, guiding present-life skills and problem-solving.',
    tags: ['intellect', 'communication', 'mercury'],
  },
  {
    id: 'PL-BASE-4',
    tradition: 'Bhrigu Samhita',
    text: 'Jupiter signals wisdom, mentors, and dharmic expansion shaping current opportunities.',
    tags: ['wisdom', 'growth', 'jupiter', 'spiritual'],
  },
  {
    id: 'PL-BASE-5',
    tradition: 'Bhrigu Samhita',
    text: 'Venus shows harmony, relationships, and aesthetics influencing present bonds and comforts.',
    tags: ['love', 'relationships', 'venus'],
  },
  {
    id: 'PL-BASE-6',
    tradition: 'Bhrigu Samhita',
    text: 'Saturn indicates responsibility and endurance, describing present-life tests and obligations.',
    tags: ['discipline', 'saturn', 'responsibility'],
  },
  {
    id: 'PL-BASE-7',
    tradition: 'Nadi Jyotisha',
    text: 'Rahu and Ketu highlight karmic hunger and detachment that color the current incarnation’s lessons.',
    tags: ['karmic', 'rahu', 'ketu', 'transformation'],
  },
  {
    id: 'PL-BASE-8',
    tradition: 'Nadi Jyotisha',
    text: 'The current dasha period activates specific life themes; align actions with the maha dasha lord’s nature.',
    tags: ['dasha', 'timing', 'focus'],
  },
];

const TAG_KEYWORDS: Record<string, string[]> = {
  mind: ['mind', 'emotion', 'emotional', 'moon', 'psychology'],
  drive: ['drive', 'courage', 'conflict', 'mars', 'initiative'],
  intellect: ['mercury', 'intellect', 'communication', 'speech', 'analysis'],
  wisdom: ['jupiter', 'wisdom', 'mentor', 'teacher', 'dharma'],
  love: ['venus', 'love', 'romance', 'beauty', 'comfort', 'partnership'],
  discipline: ['saturn', 'discipline', 'endurance', 'responsibility', 'delay'],
  karmic: ['rahu', 'ketu', 'karmic', 'detachment', 'desire'],
  career: ['career', 'profession', '10th house', 'authority', 'leadership'],
  relationships: ['marriage', 'spouse', 'partnership', 'relationship', '7th house'],
  health: ['health', 'vitality', '6th house', 'disease'],
  wealth: ['wealth', 'prosperity', 'finance', '2nd house', '11th house'],
  spiritual: ['spiritual', 'moksha', 'liberation', 'meditation', 'dharma'],
  dasha: ['dasha', 'period', 'timing'],
};

const PLANET_STRENGTHS: Record<string, string> = {
  Sun: 'vitality, confidence, and leadership purpose',
  Moon: 'emotional intelligence and intuitive memory',
  Mars: 'decisive action and courageous initiative',
  Mercury: 'analytical thinking and articulate communication',
  Jupiter: 'guidance, optimism, and wisdom-driven expansion',
  Venus: 'harmony in relationships and refined creativity',
  Saturn: 'endurance, discipline, and long-term structure',
  Rahu: 'innovation, ambition, and unconventional growth',
  Ketu: 'detachment, inner clarity, and spiritual discernment',
};

const PLANET_CHALLENGES: Record<string, string> = {
  Sun: 'pressure around recognition or authority dynamics',
  Moon: 'fluctuating moods or emotional overwhelm',
  Mars: 'impatience or conflict if energy is unchanneled',
  Mercury: 'overthinking or scattered focus',
  Jupiter: 'overextension or missed details',
  Venus: 'comfort-seeking that delays tough decisions',
  Saturn: 'fear of delay or heavy responsibilities',
  Rahu: 'restlessness or craving shortcuts',
  Ketu: 'withdrawal that limits connection',
};

const SIGN_ELEMENTS: Record<string, string> = {
  Aries: 'fire',
  Leo: 'fire',
  Sagittarius: 'fire',
  Taurus: 'earth',
  Virgo: 'earth',
  Capricorn: 'earth',
  Gemini: 'air',
  Libra: 'air',
  Aquarius: 'air',
  Cancer: 'water',
  Scorpio: 'water',
  Pisces: 'water',
};

const ELEMENT_TONES: Record<string, string> = {
  fire: 'initiative and leadership lessons',
  earth: 'stability and stewardship themes',
  air: 'communication and ideation emphasis',
  water: 'emotional depth and empathy growth',
};

const isCacheValid = (entry?: CacheEntry<unknown>) => Boolean(entry && entry.expiresAt > Date.now());

async function fileExists(filePath: string): Promise<boolean> {
  try {
    await fs.stat(filePath);
    return true;
  } catch {
    return false;
  }
}

async function resolveWisdomPath(relativePath: string): Promise<string | null> {
  const candidates = [
    path.join(process.cwd(), relativePath),
    path.join(process.cwd(), 'frontend', relativePath),
    path.join(process.cwd(), '..', relativePath),
  ];

  for (const candidate of candidates) {
    if (await fileExists(candidate)) {
      return candidate;
    }
  }

  return null;
}

function normalizeText(value: string): string {
  return value.toLowerCase();
}

function extractRuleTags(text: string): string[] {
  const normalized = normalizeText(text);
  const tags = new Set<string>();

  for (const [tag, keywords] of Object.entries(TAG_KEYWORDS)) {
    if (keywords.some(keyword => normalized.includes(keyword))) {
      tags.add(tag);
    }
  }

  return Array.from(tags);
}

function parseMarkdownRules(text: string, tradition: RuleTradition): PresentLifeRule[] {
  const ruleRegex = /\*\*Rule\s+([A-Z]{2}-\d{3})\*\*:\s*(.+)/g;
  const rules: PresentLifeRule[] = [];
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

function parseCodexGuidance(text: string): PresentLifeRule[] {
  const lines = text
    .split('\n')
    .map(line => line.trim())
    .filter(line => line.length > 40 && !line.startsWith('#'));

  return lines
    .filter(line => line.includes('present') || line.includes('Life Script') || line.includes('personality'))
    .slice(0, 8)
    .map((line, index) => ({
      id: `BS-CODEX-${index + 1}`,
      tradition: 'Bhrigu Samhita Codex',
      text: line.replace(/^[-*]\s*/, ''),
      tags: extractRuleTags(line),
    }));
}

function parseYamlDescriptions(text: string, source: string): PresentLifeRule[] {
  const rules: PresentLifeRule[] = [];
  const quoted = /description:\s*"([^"]+)"/g;
  const unquoted = /description:\s*([^\n]+)/g;

  let match = quoted.exec(text);
  while (match) {
    const description = match[1].trim();
    rules.push({
      id: `YAML-${rules.length + 1}`,
      tradition: 'Bhrigu Samhita',
      text: description,
      tags: extractRuleTags(description),
      source,
    });
    match = quoted.exec(text);
  }

  match = unquoted.exec(text);
  while (match) {
    const description = match[1].trim();
    if (!description.startsWith('{') && !description.startsWith('[')) {
      rules.push({
        id: `YAML-${rules.length + 1}`,
        tradition: 'Bhrigu Samhita',
        text: description,
        tags: extractRuleTags(description),
        source,
      });
    }
    match = unquoted.exec(text);
  }

  return rules;
}

async function loadWisdomSources(cacheTtlMs: number): Promise<WisdomSources> {
  const cacheKey = 'present-life-wisdom';
  const cached = RULE_CACHE.get(cacheKey);
  if (isCacheValid(cached)) {
    return cached!.data;
  }

  const warnings: string[] = [];
  const summaries: string[] = [];
  const rules: PresentLifeRule[] = [...PRESENT_LIFE_BASE_RULES];

  const bhriguPath = await resolveWisdomPath('core_wisdom/bhrigu_samhita_rules.md');
  const nadiPath = await resolveWisdomPath('core_wisdom/nadi_jyotisha_rules.md');
  const codexPath = await resolveWisdomPath('docs/bhrigu_samhita_jyotish_engine.md');
  const principlesPath = await resolveWisdomPath('backend/data/bhrigu_samhita_principles.yml');

  let bhriguText = '';
  let nadiText = '';
  let codexText = '';
  let principlesText = '';

  if (bhriguPath) {
    bhriguText = await fs.readFile(bhriguPath, 'utf-8');
  } else {
    warnings.push('Bhrigu Samhita rules missing locally; using fallback and remote sources.');
  }

  if (nadiPath) {
    nadiText = await fs.readFile(nadiPath, 'utf-8');
  } else {
    warnings.push('Nadi Jyotisha rules missing locally; using fallback and remote sources.');
  }

  if (codexPath) {
    codexText = await fs.readFile(codexPath, 'utf-8');
  } else {
    warnings.push('Bhrigu Samhita codex missing locally; using fallback and remote sources.');
  }

  if (principlesPath) {
    principlesText = await fs.readFile(principlesPath, 'utf-8');
  } else {
    warnings.push('Bhrigu Samhita principles missing locally; using fallback and remote sources.');
  }

  if (!bhriguText || !nadiText || !codexText || !principlesText) {
    const remoteResults = await Promise.allSettled(
      REMOTE_RULE_SOURCES.map(async url => {
        const response = await fetch(url);
        if (!response.ok) {
          throw new Error(`Failed to fetch ${url}`);
        }
        return response.text();
      })
    );

    for (const result of remoteResults) {
      if (result.status === 'fulfilled') {
        const value = result.value;
        if (value.includes('Bhrigu Samhita Rules')) {
          bhriguText = bhriguText || value;
        } else if (value.includes('Nadi Jyotisha Rules')) {
          nadiText = nadiText || value;
        } else if (value.includes('Bhrigu Samhita Jyotish Engine')) {
          codexText = codexText || value;
        } else if (value.includes('Bhrigu Samhita Predictive Keys')) {
          principlesText = principlesText || value;
        }
      }
    }
  }

  if (bhriguText) {
    const bhriguRules = parseMarkdownRules(bhriguText, 'Bhrigu Samhita');
    rules.push(...bhriguRules);
    summaries.push(`Bhrigu Samhita: ${bhriguRules.length} rules parsed.`);
  }

  if (nadiText) {
    const nadiRules = parseMarkdownRules(nadiText, 'Nadi Jyotisha');
    rules.push(...nadiRules);
    summaries.push(`Nadi Jyotisha: ${nadiRules.length} rules parsed.`);
  }

  if (codexText) {
    const codexRules = parseCodexGuidance(codexText);
    rules.push(...codexRules);
    summaries.push(`Bhrigu codex: ${codexRules.length} guidance lines parsed.`);
  }

  if (principlesText) {
    const principleRules = parseYamlDescriptions(principlesText, 'bhrigu_samhita_principles.yml');
    rules.push(...principleRules);
    summaries.push(`Principles corpus: ${principleRules.length} sutras parsed.`);
  }

  const sources: WisdomSources = {
    rules,
    summaries: summaries.length > 0 ? summaries : ['Fallback rules applied.'],
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
    chartData.zodiac_sign,
    chartData.moon_sign,
    chartData.ascendant,
    chartData.nakshatra,
  ].filter(Boolean) as string[];

  if (chartData.planets) {
    keywords.push(...Object.keys(chartData.planets));
  }

  return keywords.map(keyword => keyword.toLowerCase());
}

function scoreRuleMatch(rule: PresentLifeRule, chartData: ChartData): number {
  const normalizedRule = normalizeText(rule.text);
  const keywords = buildChartKeywords(chartData);
  let score = 0;

  for (const keyword of keywords) {
    if (normalizedRule.includes(keyword)) {
      score += 16;
    }
  }

  if (rule.tags.includes('mind') || rule.tags.includes('emotions')) {
    score += 10;
  }

  if (rule.tags.includes('dasha')) {
    score += 12;
  }

  if (rule.tags.includes('career') || rule.tags.includes('relationships')) {
    score += 8;
  }

  return Math.min(score, 100);
}

function matchRules(chartData: ChartData, rules: PresentLifeRule[]): PresentLifeRule[] {
  return rules
    .map(rule => ({
      ...rule,
      weight: scoreRuleMatch(rule, chartData),
    }))
    .sort((a, b) => (b.weight ?? 0) - (a.weight ?? 0))
    .slice(0, 20)
    .map(rule => ({
      id: rule.id,
      tradition: rule.tradition,
      text: rule.text,
      tags: rule.tags,
      weight: rule.weight,
      source: rule.source,
    }));
}

function deriveFocusAreas(rules: PresentLifeRule[]): string[] {
  const tally: Record<string, number> = {};

  for (const rule of rules) {
    for (const tag of rule.tags) {
      tally[tag] = (tally[tag] ?? 0) + 1;
    }
  }

  return Object.entries(tally)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 4)
    .map(([tag]) => tag);
}

function buildDashaTheme(chartData: ChartData): string {
  const dasha = (chartData as { dasha_period?: { maha_dasha?: string; years_remaining?: number } })
    .dasha_period;

  if (dasha?.maha_dasha) {
    const years = dasha.years_remaining ? ` with ~${dasha.years_remaining} years remaining` : '';
    return `Current maha dasha: ${dasha.maha_dasha}${years}. Themes of this graha color present-life focus.`;
  }

  return 'Current dasha not provided; present-life themes inferred primarily from Moon, Ascendant, and planetary balance.';
}

function buildOverview(chartData: ChartData, focusAreas: string[]): string {
  const ascendant = chartData.ascendant || 'the ascendant';
  const moon = chartData.moon_sign || 'the Moon sign';
  const element = chartData.moon_sign ? SIGN_ELEMENTS[chartData.moon_sign] : undefined;
  const elementTone = element ? ELEMENT_TONES[element] : 'balanced elemental themes';

  const focusText = focusAreas.length > 0
    ? focusAreas.map(area => area.replace('_', ' ')).join(', ')
    : 'mind, relationships, and dharmic growth';

  return `Present Life: current karmic focus on ${focusText}. The ascendant (${ascendant}) sets the life approach, while the Moon (${moon}) highlights ${elementTone}.`;
}

function buildStrengths(chartData: ChartData): string[] {
  const strengths: string[] = [];

  if (chartData.planets) {
    for (const planet of Object.keys(chartData.planets)) {
      const strength = PLANET_STRENGTHS[planet];
      if (strength) {
        strengths.push(`${planet} supports ${strength}.`);
      }
    }
  }

  if (strengths.length === 0) {
    strengths.push('Your chart suggests adaptive resilience and the ability to learn quickly from experience.');
  }

  return strengths.slice(0, 5);
}

function buildChallenges(chartData: ChartData): string[] {
  const challenges: string[] = [];

  if (chartData.planets) {
    for (const planet of Object.keys(chartData.planets)) {
      const challenge = PLANET_CHALLENGES[planet];
      if (challenge) {
        challenges.push(`${planet} may bring ${challenge}.`);
      }
    }
  }

  if (challenges.length === 0) {
    challenges.push('Life lessons focus on balancing ambition with patience and emotional clarity.');
  }

  return challenges.slice(0, 5);
}

function generatePresentLifeProfile(
  chartData: ChartData,
  matchedRules: PresentLifeRule[]
): PresentLifeProfile {
  const focusAreas = deriveFocusAreas(matchedRules);
  const overview = buildOverview(chartData, focusAreas);
  const strengths = buildStrengths(chartData);
  const challenges = buildChallenges(chartData);
  const dashaTheme = buildDashaTheme(chartData);

  return {
    overview,
    strengths,
    challenges,
    focusAreas: focusAreas.length > 0 ? focusAreas : ['mind', 'career', 'relationships'],
    dashaTheme,
    supportingRules: matchedRules.slice(0, 6),
  };
}

function precisionCheck(profile: PresentLifeProfile, chartData: ChartData): PrecisionCheckResult {
  const notes: string[] = [];
  let adjustedOverview = profile.overview;

  if (chartData.ascendant && !adjustedOverview.includes(chartData.ascendant)) {
    adjustedOverview += ` Ascendant validation: ${chartData.ascendant} confirms the life-path orientation.`;
    notes.push('Ascendant reference added for validation.');
  }

  if (chartData.moon_sign && !adjustedOverview.includes(chartData.moon_sign)) {
    adjustedOverview += ` Moon sign (${chartData.moon_sign}) anchors emotional reality checks.`;
    notes.push('Moon sign reference added for validation.');
  }

  const focus = profile.focusAreas.length > 0 ? profile.focusAreas : ['mind'];
  if (focus.length < 2) {
    notes.push('Focus areas expanded to ensure balanced interpretation.');
    focus.push('discipline');
  }

  const planetCount = Object.keys(chartData.planets || {}).length;
  const balanceScore = Math.min(100, 40 + planetCount * 5 + focus.length * 6);

  if (balanceScore < 60) {
    notes.push('Planetary balance appears light; interpretations stay symbolic and reflective.');
  } else {
    notes.push('Planetary balance supports stable present-life themes.');
  }

  return {
    adjustedOverview,
    notes,
    balanceScore,
    validatedFocus: Array.from(new Set(focus)),
  };
}

function buildSubcategories(
  profile: PresentLifeProfile,
  precision: PrecisionCheckResult,
  sources: WisdomSources
): Record<string, Subcategory> {
  return {
    generation_phase: {
      title: 'Generation Phase: Present Life Overview',
      content: [
        precision.adjustedOverview,
        `Primary focus areas: ${precision.validatedFocus.join(', ')}.`,
        profile.dashaTheme,
      ].join('\n'),
      data: {
        overview: precision.adjustedOverview,
        focusAreas: precision.validatedFocus,
        dashaTheme: profile.dashaTheme,
      },
    },
    strengths: {
      title: 'Strengths & Opportunities',
      content: profile.strengths.map(item => `- ${item}`).join('\n'),
      data: profile.strengths,
    },
    challenges: {
      title: 'Challenges & Growth Edges',
      content: profile.challenges.map(item => `- ${item}`).join('\n'),
      data: profile.challenges,
    },
    karmic_focus: {
      title: 'Current Karmic Focus',
      content: profile.supportingRules
        .map(rule => `- (${rule.tradition}) ${rule.text}`)
        .join('\n'),
      data: profile.supportingRules,
    },
    precision_check: {
      title: 'Precision Check',
      content: [
        `Balance score: ${precision.balanceScore}/100.`,
        ...precision.notes.map(note => `- ${note}`),
      ].join('\n'),
      data: {
        balanceScore: precision.balanceScore,
        notes: precision.notes,
      },
    },
    sources: {
      title: 'Source Alignment',
      content: [
        ...sources.summaries.map(summary => `- ${summary}`),
        ...(sources.warnings.length > 0
          ? sources.warnings.map(warning => `- Warning: ${warning}`)
          : ['- All present-life sources loaded successfully.']),
      ].join('\n'),
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
    `Zodiac: ${chartData.zodiac_sign || 'Unknown'}`,
    `Moon sign: ${chartData.moon_sign || 'Unknown'}`,
    `Ascendant: ${chartData.ascendant || 'Unknown'}`,
    `Nakshatra: ${chartData.nakshatra || 'Unknown'}`,
    `Planets: ${planets}`,
  ].join('\n');
}

async function generateAiSynthesis(
  chartData: ChartData,
  profile: PresentLifeProfile,
  precision: PrecisionCheckResult,
  sources: WisdomSources,
  options: PresentLifeOptions
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
    'You are a Bhrigu Samhita + Nadi Jyotisha present-life engine.',
    'Work in two phases: generate present-life overview, then precision-check alignment with Moon and Ascendant.',
    'Use symbolic language; avoid deterministic predictions.',
    `Chart summary:\n${buildChartSummary(chartData)}`,
    `Present-life overview: ${precision.adjustedOverview}`,
    `Strengths: ${profile.strengths.join('; ')}`,
    `Challenges: ${profile.challenges.join('; ')}`,
    `Focus areas: ${precision.validatedFocus.join(', ')}`,
    `Sources: ${sources.summaries.join(' ')}`,
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
            content: 'You are an expert Jyotisa assistant grounded in Bhrigu Samhita and Nadi Jyotisha.',
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

function buildCacheKey(chartData: ChartData, options: PresentLifeOptions): string {
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

export async function generatePresentLifePrediction(
  chartData: ChartData,
  options: PresentLifeOptions = {}
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
      engine: 'present_life',
      title: 'Present Life Analysis',
      success: false,
      subcategories: {},
      error: `Invalid chart data: ${validationErrors.join(', ')}`,
      generated_at: new Date().toISOString(),
      mode: options.mode || 'offline',
    };
  }

  const sources = await loadWisdomSources(cacheTtlMs);
  const matchedRules = matchRules(chartData, sources.rules);
  const profile = generatePresentLifeProfile(chartData, matchedRules);
  const precision = precisionCheck(profile, chartData);
  const aiSynthesis = await generateAiSynthesis(chartData, profile, precision, sources, options);

  const result: PredictionResult = {
    engine: 'present_life',
    title: 'Present Life Analysis',
    success: true,
    subcategories: buildSubcategories(profile, precision, sources),
    ai_synthesis: aiSynthesis,
    generated_at: new Date().toISOString(),
    mode: options.mode || 'offline',
    metadata: {
      engine: 'present_life',
      zodiac_sign: chartData.zodiac_sign || 'Unknown',
      moon_sign: chartData.moon_sign || 'Unknown',
      ascendant: chartData.ascendant || 'Unknown',
      nakshatra: chartData.nakshatra || 'Unknown',
      ai_enhanced: Boolean(aiSynthesis),
      tradition: 'Bhrigu Samhita + Nadi Jyotisha',
      calculation_method: 'Two-phase present-life synthesis (generation + precision check)',
    },
  };

  PREDICTION_CACHE.set(cacheKey, {
    data: result,
    expiresAt: Date.now() + cacheTtlMs,
  });

  return result;
}
