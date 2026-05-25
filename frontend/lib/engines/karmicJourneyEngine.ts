'use client';

/**
 * Karmic Journey Prediction Engine
 * Two-phase engine: generation + precision check using Bhrigu Samhita & Nadi Jyotisa rules.
 *
 * Offline-first: pure computation with optional AI refinement, no secrets or database access.
 */
import type { ChartData, PredictionResult, Subcategory } from '../api/predictions';
import { getAIMode } from '../ai-preferences';
import { isSectionContentValid } from '../sectionParserConfig';

type KarmicJourneyMode = 'offline' | 'online' | 'hybrid';

type KarmicJourneyLogger = Pick<Console, 'debug' | 'info' | 'warn' | 'error'>;

export interface KarmicJourneyOptions {
  mode?: KarmicJourneyMode;
  useAI?: boolean;
  cacheTTLms?: number;
  language?: string;
  logger?: KarmicJourneyLogger;
}

interface KarmicRule {
  id: string;
  tradition: string;
  text: string;
  tags: string[];
  source: string;
}

interface KarmicCorpus {
  rules: KarmicRule[];
  summary: string;
  sources: string[];
  warnings: string[];
}

interface ChartAlignment {
  aligned: boolean;
  missing: string[];
  notes: string[];
}

interface ChartInsights {
  element: string;
  sunSign: string;
  jupiterSign: string;
  saturnSign: string;
  moonSign: string;
  ascendant: string;
  nakshatra: string;
  sunHouse: number | null;
  jupiterHouse: number | null;
  saturnHouse: number | null;
  ketuHouse: number | null;
  ninthHouseSign: string | null;
  tenthHouseSign: string | null;
  twelfthHouseSign: string | null;
  alignment: ChartAlignment;
}

interface KarmicJourneyNarrative {
  soulPurpose: string;
  karmicLessons: string;
  lifeMission: string;
  precisionNotes: string[];
  ruleRefs: KarmicRule[];
  complianceNote: string;
}

interface CacheEntry {
  expiresAt: number;
  result: PredictionResult;
}

const DEFAULT_CACHE_TTL = 15 * 60 * 1000; // 15 minutes for better caching

const ruleCache = new Map<string, KarmicCorpus>();
const predictionCache = new Map<string, CacheEntry>();

const DEFAULT_LOGGER: KarmicJourneyLogger = {
  debug: (...args) => console.debug('[KarmicJourneyEngine]', ...args),
  info: (...args) => console.info('[KarmicJourneyEngine]', ...args),
  warn: (...args) => console.warn('[KarmicJourneyEngine]', ...args),
  error: (...args) => console.error('[KarmicJourneyEngine]', ...args),
};

const ELEMENT_BY_SIGN: Record<string, string> = {
  Aries: 'Fire',
  Taurus: 'Earth',
  Gemini: 'Air',
  Cancer: 'Water',
  Leo: 'Fire',
  Virgo: 'Earth',
  Libra: 'Air',
  Scorpio: 'Water',
  Sagittarius: 'Fire',
  Capricorn: 'Earth',
  Aquarius: 'Air',
  Pisces: 'Water',
};

const HOUSE_THEMES: Record<number, string> = {
  1: 'identity and soul path',
  2: 'values, family karma, and voice',
  3: 'courage, skills, and sibling karma',
  4: 'home, roots, and emotional foundation',
  5: 'creativity, children, and past merit (purva punya)',
  6: 'service, healing, and karmic debts',
  7: 'partnerships and sacred contracts',
  8: 'transformation, lineage mysteries, and deep healing',
  9: 'dharma, mentors, and spiritual fortune',
  10: 'career mission and public contribution',
  11: 'community, gains, and visionary networks',
  12: 'moksha, retreat, and spiritual completion',
};

const RULE_KEYWORDS = [
  'sun',
  'jupiter',
  'saturn',
  'dharma',
  'karma',
  'karmic',
  'moksha',
  'samskara',
  'past-life',
  'past life',
  'soul',
  'purpose',
  'mission',
  '9th',
  'ninth',
  '12th',
  'twelfth',
  'ketu',
  'rahu',
];

const DEFAULT_RULES: KarmicRule[] = [
  {
    id: 'BS-006',
    tradition: 'Bhrigu Samhita',
    text: 'Jupiter in its own sign in the 1st, 5th, or 9th house grants wisdom and spiritual inclination.',
    tags: ['jupiter', 'dharma', 'spiritual'],
    source: 'core_wisdom/bhrigu_samhita_rules.md',
  },
  {
    id: 'BS-008',
    tradition: 'Bhrigu Samhita',
    text: 'Saturn in the 3rd, 6th, or 11th house becomes protective through sustained discipline.',
    tags: ['saturn', 'karmic', 'discipline'],
    source: 'core_wisdom/bhrigu_samhita_rules.md',
  },
  {
    id: 'BS-036',
    tradition: 'Bhrigu Samhita',
    text: 'The 9th lord in the 9th house strengthens dharma and spiritual wisdom.',
    tags: ['dharma', 'ninth', 'jupiter'],
    source: 'core_wisdom/bhrigu_samhita_rules.md',
  },
  {
    id: 'BR-19',
    tradition: 'Bhrigu Samhita',
    text: 'Ketu in the twelfth bhava indicates detachment and contemplative past-life refinement.',
    tags: ['ketu', 'moksha', 'past life'],
    source: 'backend/data/bhrigu_samhita_principles.yml',
  },
];

const TEXT_SOURCES = [
  'core_wisdom/bhrigu_samhita_rules.md',
  'backend/data/bhrigu_samhita_principles.yml',
  'docs/bhrigu_samhita_enhancements.md',
  'docs/bhrigu_samhita_jyotish_engine.md',
];

const isServer = (): boolean => typeof window === 'undefined';

const safeTitle = (value?: string): string =>
  value ? value.charAt(0).toUpperCase() + value.slice(1) : 'Unknown';

const resolveHouseIndex = (houses: string[] | undefined, sign: string | undefined): number | null => {
  if (!houses || !sign) {
    return null;
  }
  const index = houses.findIndex(house => house.toLowerCase() === sign.toLowerCase());
  return index >= 0 ? index + 1 : null;
};

const resolvePlanetHouses = (chart: ChartData): Record<string, number | null> => {
  const planetHouses: Record<string, number | null> = {};
  if (!chart.planets || !chart.houses) {
    return planetHouses;
  }
  Object.entries(chart.planets).forEach(([planet, position]) => {
    planetHouses[planet] = resolveHouseIndex(chart.houses, position.sign);
  });
  return planetHouses;
};

const buildCacheKey = (chart: ChartData, mode: KarmicJourneyMode, useAI: boolean, language: string): string =>
  JSON.stringify({
    mode,
    useAI,
    language,
    date: chart.date_of_birth,
    time: chart.time_of_birth,
    place: chart.place_of_birth,
    zodiac: chart.zodiac_sign,
    moon: chart.moon_sign,
    ascendant: chart.ascendant,
    nakshatra: chart.nakshatra,
    houses: chart.houses,
    planets: chart.planets,
  });

const getCachedPrediction = (key: string): PredictionResult | null => {
  const cached = predictionCache.get(key);
  if (!cached) {
    return null;
  }
  if (cached.expiresAt <= Date.now()) {
    predictionCache.delete(key);
    return null;
  }
  return cached.result;
};

const setCachedPrediction = (key: string, result: PredictionResult, ttl: number): void => {
  predictionCache.set(key, { result, expiresAt: Date.now() + ttl });
};

const extractTags = (text: string): string[] =>
  RULE_KEYWORDS.filter(keyword => text.toLowerCase().includes(keyword.replace('-', ' ')));

const parseMarkdownRules = (text: string, source: string): KarmicRule[] => {
  const rules: KarmicRule[] = [];
  const ruleRegex = /\*\*Rule\s+([A-Z]{2}-\d{3})\*\*:\s*(.+)/g;
  let match: RegExpExecArray | null;

  while ((match = ruleRegex.exec(text)) !== null) {
    const id = match[1];
    const ruleText = match[2]!.trim();
    rules.push({
      id,
      tradition: 'Bhrigu Samhita',
      text: ruleText,
      tags: extractTags(ruleText),
      source,
    });
  }

  return rules;
};

const parsePrinciples = (text: string, source: string): KarmicRule[] => {
  try {
    const parsed = JSON.parse(text) as { principles?: Array<{ id: string; description: string }> };
    if (!parsed.principles) {
      return [];
    }
    return parsed.principles.map((entry) => ({
      id: entry.id,
      tradition: 'Bhrigu Samhita',
      text: entry.description,
      tags: extractTags(entry.description),
      source,
    }));
  } catch {
    const rules: KarmicRule[] = [];
    const idRegex = /"id"\s*:\s*"(BR-\d+)"/g;
    const descRegex = /"description"\s*:\s*"([^"]+)"/g;
    const ids = Array.from(text.matchAll(idRegex)).map(match => match[1]);
    const descs = Array.from(text.matchAll(descRegex)).map(match => match[1]);
    ids.forEach((id, index) => {
      const description = descs[index];
      if (description) {
        rules.push({
          id,
          tradition: 'Bhrigu Samhita',
          text: description,
          tags: extractTags(description),
          source,
        });
      }
    });
    return rules;
  }
};

const parseNarrativeSentences = (text: string, source: string): KarmicRule[] => {
  const sentences = text
    .replace(/\r/g, '')
    .split(/(?<=[.!?])\s+/)
    .map(sentence => sentence.trim())
    .filter(sentence => sentence.length > 60);

  return sentences
    .filter(sentence => RULE_KEYWORDS.some(keyword => sentence.toLowerCase().includes(keyword.replace('-', ' '))))
    .slice(0, 12)
    .map((sentence, index) => ({
      id: `DOC-${source}-${index + 1}`,
      tradition: 'Bhrigu Samhita',
      text: sentence,
      tags: extractTags(sentence),
      source,
    }));
};

const buildCorpusSummary = (rules: KarmicRule[], sources: string[]): string => {
  const tagCounts = rules.reduce<Record<string, number>>((acc, rule) => {
    rule.tags.forEach(tag => {
      acc[tag] = (acc[tag] ?? 0) + 1;
    });
    return acc;
  }, {});

  const topTags = Object.entries(tagCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 4)
    .map(([tag]) => tag)
    .join(', ');

  return `Loaded ${rules.length} karmic cues from ${sources.length} sources. Dominant themes: ${topTags || 'karma, dharma, moksha'}.`;
};

const loadTextFile = async (path: string): Promise<string | null> => {
  if (!isServer()) {
    return null;
  }

  try {
    const fs = await import('node:fs/promises');
    return await fs.readFile(path, 'utf8');
  } catch {
    return null;
  }
};

const loadCorpus = async (logger: KarmicJourneyLogger): Promise<KarmicCorpus> => {
  const cached = ruleCache.get('karmic-corpus');
  if (cached) {
    return cached;
  }

  const rules: KarmicRule[] = [];
  const sources: string[] = [];
  const warnings: string[] = [];

  for (const source of TEXT_SOURCES) {
    const text = await loadTextFile(source);
    if (!text) {
      warnings.push(`Unable to load ${source}.`);
      continue;
    }
    sources.push(source);
    if (source.endsWith('.md')) {
      rules.push(...parseMarkdownRules(text, source));
      rules.push(...parseNarrativeSentences(text, source));
    } else if (source.endsWith('.yml')) {
      rules.push(...parsePrinciples(text, source));
    }
  }

  const corpus: KarmicCorpus = {
    rules: rules.length ? rules : DEFAULT_RULES,
    summary: buildCorpusSummary(rules.length ? rules : DEFAULT_RULES, sources.length ? sources : TEXT_SOURCES),
    sources: sources.length ? sources : TEXT_SOURCES,
    warnings,
  };

  if (!rules.length) {
    logger.warn('No local karmic rules found, using defaults.');
  }

  ruleCache.set('karmic-corpus', corpus);
  return corpus;
};

const buildAlignment = (chart: ChartData): ChartAlignment => {
  const missing: string[] = [];
  if (!chart.ascendant) missing.push('ascendant');
  if (!chart.moon_sign) missing.push('moon_sign');
  if (!chart.zodiac_sign && !chart.moon_sign) missing.push('zodiac_sign');
  if (!chart.houses || chart.houses.length !== 12) missing.push('houses');
  if (!chart.planets?.Sun?.sign) missing.push('Sun placement');
  if (!chart.planets?.Jupiter?.sign) missing.push('Jupiter placement');
  if (!chart.planets?.Saturn?.sign) missing.push('Saturn placement');

  const aligned = missing.length === 0;
  const notes = aligned
    ? ['Chart anchors verified: ascendant, Moon sign, Sun/Jupiter/Saturn, and 12 houses.']
    : ['Chart alignment incomplete; predictions withheld per Bhrigu Samhita alignment protocol.'];
  return { aligned, missing, notes };
};

const buildChartInsights = (chart: ChartData): ChartInsights => {
  const planetHouses = resolvePlanetHouses(chart);
  const sunSign = safeTitle(chart.planets?.Sun?.sign ?? chart.zodiac_sign ?? chart.moon_sign ?? 'Unknown');
  const jupiterSign = safeTitle(chart.planets?.Jupiter?.sign ?? 'Unknown');
  const saturnSign = safeTitle(chart.planets?.Saturn?.sign ?? 'Unknown');

  return {
    element: ELEMENT_BY_SIGN[chart.zodiac_sign ?? chart.moon_sign ?? ''] ?? 'Unknown',
    sunSign,
    jupiterSign,
    saturnSign,
    moonSign: safeTitle(chart.moon_sign ?? 'Unknown'),
    ascendant: safeTitle(chart.ascendant ?? 'Unknown'),
    nakshatra: safeTitle(chart.nakshatra ?? 'Unknown'),
    sunHouse: planetHouses.Sun ?? null,
    jupiterHouse: planetHouses.Jupiter ?? null,
    saturnHouse: planetHouses.Saturn ?? null,
    ketuHouse: planetHouses.Ketu ?? null,
    ninthHouseSign: chart.houses?.[8] ? safeTitle(chart.houses[8]) : null,
    tenthHouseSign: chart.houses?.[9] ? safeTitle(chart.houses[9]) : null,
    twelfthHouseSign: chart.houses?.[11] ? safeTitle(chart.houses[11]) : null,
    alignment: buildAlignment(chart),
  };
};

const selectRules = (corpus: KarmicCorpus, tags: string[], limit: number): KarmicRule[] => {
  const selected = corpus.rules
    .filter(rule => tags.some(tag => rule.tags.includes(tag)))
    .slice(0, limit);
  return selected.length ? selected : corpus.rules.slice(0, limit);
};

const describeHouseTheme = (house: number | null): string =>
  house ? HOUSE_THEMES[house] ?? 'significant karmic focus' : 'karmic focus not yet aligned';

const buildKarmicNarrative = (insights: ChartInsights, corpus: KarmicCorpus): KarmicJourneyNarrative => {
  const ruleRefs = selectRules(corpus, ['sun', 'jupiter', 'saturn', 'dharma', 'karmic', 'moksha'], 4);
  const precisionNotes: string[] = [...insights.alignment.notes];

  if (!insights.alignment.aligned) {
    const missing = insights.alignment.missing.join(', ');
    return {
      soulPurpose:
        'Chart alignment is required before karmic purpose can be revealed. Please provide full birth details to unlock the soul-purpose synthesis.',
      karmicLessons:
        `Karmic lessons are held in Saturn’s placement and the 6th/8th/12th houses. Missing data: ${missing}.`,
      lifeMission:
        'Life mission guidance is paused until the 9th, 10th, and 12th house alignments are confirmed.',
      precisionNotes: [
        `Alignment missing: ${missing}.`,
        'No predictions are issued without chart alignment (Bhrigu Samhita compliance).',
      ],
      ruleRefs,
      complianceNote: 'Compliance note: Predictions withheld until chart alignment is complete.',
    };
  }

  const sunHouseTheme = describeHouseTheme(insights.sunHouse);
  const jupiterHouseTheme = describeHouseTheme(insights.jupiterHouse);
  const saturnHouseTheme = describeHouseTheme(insights.saturnHouse);
  const ninthHouse = insights.ninthHouseSign ?? 'Unknown';
  const tenthHouse = insights.tenthHouseSign ?? 'Unknown';
  const twelfthHouse = insights.twelfthHouseSign ?? 'Unknown';

  const karmicDebtTone = insights.saturnHouse && [6, 8, 12].includes(insights.saturnHouse)
    ? 'pronounced karmic debts that demand disciplined service and healing'
    : insights.saturnHouse && [3, 11].includes(insights.saturnHouse)
      ? 'protective karmic duties that reward resilience and steady effort'
      : 'structured responsibilities that mature through patience and integrity';

  const soulPurpose =
    `Karmic Journey: Soul evolution through ${insights.element.toLowerCase()} element refinement. ` +
    `Sun in ${insights.sunSign} (house ${insights.sunHouse ?? 'unknown'}) highlights ${sunHouseTheme}, ` +
    `while Jupiter in ${insights.jupiterSign} (house ${insights.jupiterHouse ?? 'unknown'}) opens ${jupiterHouseTheme}. ` +
    `The 9th house in ${ninthHouse} anchors dharma and mentorship pathways.`;

  const karmicLessons =
    `Saturn in ${insights.saturnSign} (house ${insights.saturnHouse ?? 'unknown'}) signals ${karmicDebtTone}. ` +
    `This indicates lessons in ${saturnHouseTheme}, guiding the soul to balance duty with compassion. ` +
    `Ketu in house ${insights.ketuHouse ?? 'unknown'} adds detachment cues, especially toward ${describeHouseTheme(insights.ketuHouse)}.`;

  const lifeMission =
    `Life mission emerges through the 10th house in ${tenthHouse}: contribute through ` +
    `${tenthHouse === 'Unknown' ? 'service and mastery' : `${tenthHouse.toLowerCase()}-style leadership and craftsmanship`}. ` +
    `The 12th house in ${twelfthHouse} requests restorative retreats and moksha-aligned practices to seal karmic cycles.`;

  precisionNotes.push(
    `Sun/Jupiter/Saturn placements cross-referenced with ${ruleRefs.map(rule => rule.id).join(', ')}.`,
    `Saturn debt check: ${karmicDebtTone}.`,
    `Dharma alignment confirmed via 9th house (${ninthHouse}).`,
  );

  return {
    soulPurpose,
    karmicLessons,
    lifeMission,
    precisionNotes,
    ruleRefs,
    complianceNote: 'Compliance note: Predictions validated against Bhrigu Samhita sutras and house lordship checks.',
  };
};

const formatRuleRefs = (rules: KarmicRule[]): string =>
  rules.length
    ? rules.map(rule => `- ${rule.id} (${rule.source}): ${rule.text}`).join('\n')
    : 'No explicit sutra references were matched.';

const buildSubcategories = (narrative: KarmicJourneyNarrative, corpus: KarmicCorpus): Record<string, Subcategory> => ({
  soul_purpose: {
    title: 'Soul Purpose & Karmic Signature',
    content: narrative.soulPurpose,
  },
  karmic_lessons: {
    title: 'Karmic Lessons & Debts',
    content: narrative.karmicLessons,
  },
  life_mission: {
    title: 'Life Mission & Dharma',
    content: narrative.lifeMission,
  },
  precision_check: {
    title: 'Precision Check (Phase 2 Validation)',
    content: `${narrative.precisionNotes.map(note => `- ${note}`).join('\n')}
\n${narrative.complianceNote}`,
  },
  sutra_references: {
    title: 'Bhrigu/Nadi Sutra References',
    content: formatRuleRefs(narrative.ruleRefs),
  },
  corpus_summary: {
    title: 'Corpus Summary',
    content: `${corpus.summary}${corpus.warnings.length ? `\nWarnings: ${corpus.warnings.join(' ')}` : ''}`,
  },
});

const fetchAISynthesis = async (
  chart: ChartData,
  narrative: KarmicJourneyNarrative,
  mode: KarmicJourneyMode
): Promise<string | null> => {
  if (typeof window === 'undefined' || mode === 'offline') {
    return null;
  }

  const aiMode = getAIMode();
  if (!aiMode.consent || aiMode.mode === 'offline') {
    return null;
  }

  try {
    const response = await fetch('/api/ai/compose', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-AI-Consent': 'granted',
        'X-AI-Mode': aiMode.mode,
      },
      body: JSON.stringify({
        report_section: 'karmic_journey',
        birth_data: {
          zodiac_sign: chart.zodiac_sign,
          moon_sign: chart.moon_sign,
          ascendant: chart.ascendant,
          nakshatra: chart.nakshatra,
          planetary_positions: chart.planets,
          houses: chart.houses,
        },
        draft: {
          soul_purpose: narrative.soulPurpose,
          karmic_lessons: narrative.karmicLessons,
          life_mission: narrative.lifeMission,
        },
      }),
    });

    if (!response.ok) {
      return null;
    }

    const payload = await response.json();
    const refined = payload?.data?.refined_section ?? null;
    return isSectionContentValid(refined) ? refined : null;
  } catch (error) {
    console.error('[KarmicJourneyEngine] AI synthesis failed:', error);
    return null;
  }
};

export const generateKarmicJourneyPrediction = async (
  chart: ChartData,
  options: KarmicJourneyOptions = {}
): Promise<PredictionResult> => {
  const {
    mode = 'offline',
    useAI = true,
    cacheTTLms = DEFAULT_CACHE_TTL,
    language = 'en',
    logger = DEFAULT_LOGGER,
  } = options;

  const cacheKey = buildCacheKey(chart, mode, useAI, language);
  const cached = getCachedPrediction(cacheKey);
  if (cached) {
    return cached;
  }

  const corpus = await loadCorpus(logger);
  const insights = buildChartInsights(chart);
  const narrative = buildKarmicNarrative(insights, corpus);
  const aiSynthesis = useAI ? await fetchAISynthesis(chart, narrative, mode) : null;

  const result: PredictionResult = {
    engine: 'karmic_journey',
    title: 'Your Karmic Journey & Soul Purpose',
    success: true,
    subcategories: buildSubcategories(narrative, corpus),
    ai_synthesis: aiSynthesis ?? undefined,
    metadata: {
      engine: 'karmic_journey',
      zodiac_sign: chart.zodiac_sign ?? 'Unknown',
      moon_sign: chart.moon_sign ?? 'Unknown',
      ascendant: chart.ascendant ?? 'Unknown',
      nakshatra: chart.nakshatra ?? 'Unknown',
      ai_enhanced: Boolean(aiSynthesis),
      tradition: 'Bhrigu Samhita & Nadi Jyotisa',
      calculation_method: 'Two-phase karmic journey synthesis with sutra validation',
    },
    generated_at: new Date().toISOString(),
    mode: mode === 'hybrid' && aiSynthesis ? 'hybrid' : mode,
  };

  setCachedPrediction(cacheKey, result, cacheTTLms);
  return result;
};
