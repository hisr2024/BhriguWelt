'use client';

/**
 * Relationships Prediction Engine
 *
 * Offline-first: deterministic relationship insights with optional AI enrichment.
 */
import type { ChartData, PredictionMetadata, PredictionResult, Subcategory } from '@/lib/api/predictions';
import { getAIMode } from '@/lib/ai-preferences';
import { isSectionContentValid } from '@/lib/sectionParserConfig';

type RelationshipsMode = 'offline' | 'online' | 'hybrid';

export interface RelationshipsEngineOptions {
  mode?: RelationshipsMode;
  useAI?: boolean;
  language?: string;
  cacheTtlMs?: number;
  logger?: Pick<Console, 'debug' | 'info' | 'warn' | 'error'>;
}

interface RelationshipRule {
  text: string;
  tags: string[];
  source: string;
}

interface RelationshipCorpus {
  rules: RelationshipRule[];
  summary: string;
  sources: string[];
}

interface PrecisionCheckResult {
  isConsistent: boolean;
  confirmations: string[];
  issues: string[];
}

interface CacheEntry<T> {
  data: T;
  expiresAt: number;
}

const DEFAULT_CACHE_TTL = 15 * 60 * 1000; // 15 minutes for better caching
const corpusCache = new Map<string, CacheEntry<RelationshipCorpus>>();
const predictionCache = new Map<string, CacheEntry<PredictionResult>>();

const DEFAULT_LOGGER = {
  debug: (...args: unknown[]) => console.debug('[RelationshipsEngine]', ...args),
  info: (...args: unknown[]) => console.info('[RelationshipsEngine]', ...args),
  warn: (...args: unknown[]) => console.warn('[RelationshipsEngine]', ...args),
  error: (...args: unknown[]) => console.error('[RelationshipsEngine]', ...args),
};

const SIGN_ORDER = [
  'Aries',
  'Taurus',
  'Gemini',
  'Cancer',
  'Leo',
  'Virgo',
  'Libra',
  'Scorpio',
  'Sagittarius',
  'Capricorn',
  'Aquarius',
  'Pisces',
];

const SIGN_ELEMENT: Record<string, 'Fire' | 'Earth' | 'Air' | 'Water'> = {
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

const RULING_PLANET_BY_SIGN: Record<string, string> = {
  Aries: 'Mars',
  Taurus: 'Venus',
  Gemini: 'Mercury',
  Cancer: 'Moon',
  Leo: 'Sun',
  Virgo: 'Mercury',
  Libra: 'Venus',
  Scorpio: 'Mars',
  Sagittarius: 'Jupiter',
  Capricorn: 'Saturn',
  Aquarius: 'Saturn',
  Pisces: 'Jupiter',
};

const SEVENTH_HOUSE_TRAITS: Record<string, string> = {
  Aries: 'bold, direct partners who value independence and swift decisions.',
  Taurus: 'steady, sensual partners who prioritize loyalty and shared comforts.',
  Gemini: 'curious, communicative partners who keep relationships mentally alive.',
  Cancer: 'nurturing, family-oriented partners who seek emotional safety.',
  Leo: 'warm, expressive partners who desire romance and mutual admiration.',
  Virgo: 'practical, service-minded partners who value thoughtful consistency.',
  Libra: 'harmonious, artistic partners who thrive on balance and diplomacy.',
  Scorpio: 'intense, transformative partners who demand depth and trust.',
  Sagittarius: 'adventurous partners who seek growth, travel, and shared ideals.',
  Capricorn: 'committed, responsible partners who build long-term stability.',
  Aquarius: 'independent partners who value friendship, originality, and space.',
  Pisces: 'compassionate, soulful partners who seek spiritual connection.',
};

const COMPATIBILITY_BY_ELEMENT: Record<'Fire' | 'Earth' | 'Air' | 'Water', string> = {
  Fire: 'Best harmony with Fire and Air signatures; balance with grounded Earth.',
  Earth: 'Best harmony with Earth and Water signatures; uplift with Fire inspiration.',
  Air: 'Best harmony with Air and Fire signatures; soften with Water empathy.',
  Water: 'Best harmony with Water and Earth signatures; clarify with Air dialogue.',
};

const RELATIONSHIP_KEYWORDS = [
  'marriage',
  'spouse',
  'partner',
  'partnership',
  'relationship',
  'love',
  '7th',
  'seventh',
  'venus',
  'moon',
  'rahu',
  'ketu',
  'compatibility',
];

const DEFAULT_RULES: RelationshipRule[] = [
  {
    text: 'The 7th house, its lord, and Venus together reveal the strength and tone of marriage and committed partnerships.',
    tags: ['7th', 'venus', 'partnership'],
    source: 'Synthesized Bhrigu Samhita',
  },
  {
    text: 'Benefic influence on the 7th house supports harmony, while malefic pressure requires patience and remedial practices.',
    tags: ['7th', 'harmony', 'remedy'],
    source: 'Synthesized Nadi Jyotisa',
  },
  {
    text: 'Rahu-Ketu across the 1st/7th axis signals karmic bonds and fated encounters that transform relationship expectations.',
    tags: ['rahu', 'ketu', 'karmic', 'relationship'],
    source: 'Synthesized Nadi Jyotisa',
  },
];

const TEXT_SOURCES = [
  'core_wisdom/bhrigu_samhita_rules.md',
  'core_wisdom/nadi_jyotisha_rules.md',
  'docs/bhrigu_samhita_enhancements.md',
  'backend/data/bhrigu_samhita_principles.yml',
];

const REMOTE_SOURCES = [
  'https://raw.githubusercontent.com/hisr2024/BhriguWelt/main/core_wisdom/nadi_jyotisha_rules.md',
  'https://raw.githubusercontent.com/hisr2024/BhriguWelt/main/core_wisdom/bhrigu_samhita_rules.md',
];

const isServer = (): boolean => typeof window === 'undefined';

const normalizeText = (value: string): string => value.toLowerCase();

const getSignIndex = (sign?: string): number => (sign ? SIGN_ORDER.indexOf(sign) : -1);

const getOppositeSign = (sign?: string): string | null => {
  const index = getSignIndex(sign);
  if (index < 0) {
    return null;
  }
  return SIGN_ORDER[(index + 6) % 12];
};

const getHouseNumber = (ascendant?: string, planetSign?: string): number | null => {
  const ascIndex = getSignIndex(ascendant);
  const planetIndex = getSignIndex(planetSign);
  if (ascIndex < 0 || planetIndex < 0) {
    return null;
  }
  return ((planetIndex - ascIndex + 12) % 12) + 1;
};

const buildCacheKey = (chart: ChartData, mode: RelationshipsMode, useAI: boolean): string =>
  JSON.stringify({
    mode,
    useAI,
    date: chart.date_of_birth,
    time: chart.time_of_birth,
    place: chart.place_of_birth,
    ascendant: chart.ascendant,
    moon: chart.moon_sign,
    venus: chart.planets?.Venus?.sign,
    rahu: chart.planets?.Rahu?.sign,
    ketu: chart.planets?.Ketu?.sign,
  });

const loadTextFile = async (path: string): Promise<string | null> => {
  if (!isServer()) {
    return null;
  }
  try {
    const fs = await import('fs/promises');
    return await fs.readFile(path, 'utf8');
  } catch {
    return null;
  }
};

const extractMarkdownRules = (text: string, source: string): RelationshipRule[] => {
  const sentences = text
    .replace(/\r/g, '')
    .split(/(?<=[.!?])\s+/)
    .map(sentence => sentence.trim())
    .filter(sentence => sentence.length > 60);

  return sentences
    .filter(sentence =>
      RELATIONSHIP_KEYWORDS.some(keyword => normalizeText(sentence).includes(keyword))
    )
    .slice(0, 40)
    .map(sentence => ({
      text: sentence,
      tags: RELATIONSHIP_KEYWORDS.filter(keyword => normalizeText(sentence).includes(keyword)),
      source,
    }));
};

const extractYamlRules = (text: string, source: string): RelationshipRule[] => {
  const rules: RelationshipRule[] = [];
  const quoted = /description:\s*"([^"]+)"/g;
  const unquoted = /description:\s*([^\n]+)/g;

  let match = quoted.exec(text);
  while (match) {
    const ruleText = match[1].trim();
    if (RELATIONSHIP_KEYWORDS.some(keyword => normalizeText(ruleText).includes(keyword))) {
      rules.push({
        text: ruleText,
        tags: RELATIONSHIP_KEYWORDS.filter(keyword => normalizeText(ruleText).includes(keyword)),
        source,
      });
    }
    match = quoted.exec(text);
  }

  match = unquoted.exec(text);
  while (match) {
    if (!match[1].includes('"')) {
      const ruleText = match[1].trim();
      if (RELATIONSHIP_KEYWORDS.some(keyword => normalizeText(ruleText).includes(keyword))) {
        rules.push({
          text: ruleText,
          tags: RELATIONSHIP_KEYWORDS.filter(keyword => normalizeText(ruleText).includes(keyword)),
          source,
        });
      }
    }
    match = unquoted.exec(text);
  }

  return rules;
};

const hydrateRemoteSources = async (): Promise<string[]> => {
  const results = await Promise.allSettled(
    REMOTE_SOURCES.map(async (url) => {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 3000); // 3s timeout
      try {
        const response = await fetch(url, { signal: controller.signal });
        clearTimeout(timeoutId);
        if (!response.ok) {
          throw new Error(`Failed to fetch ${url}`);
        }
        return response.text();
      } catch (error) {
        clearTimeout(timeoutId);
        throw error;
      }
    })
  );

  return results
    .filter(result => result.status === 'fulfilled')
    .map(result => (result as PromiseFulfilledResult<string>).value);
};

const loadRelationshipCorpus = async (
  mode: RelationshipsMode,
  cacheTtlMs: number,
  logger: typeof DEFAULT_LOGGER
): Promise<RelationshipCorpus> => {
  const cacheKey = `relationships-corpus-${mode}`;
  const cached = corpusCache.get(cacheKey);
  if (cached && cached.expiresAt > Date.now()) {
    return cached.data;
  }

  const rules: RelationshipRule[] = [];
  const sources: string[] = [];

  for (const filePath of TEXT_SOURCES) {
    const text = await loadTextFile(filePath);
    if (!text) {
      continue;
    }
    sources.push(filePath);
    if (filePath.endsWith('.yml')) {
      rules.push(...extractYamlRules(text, filePath));
    } else {
      rules.push(...extractMarkdownRules(text, filePath));
    }
  }

  if ((mode === 'online' || mode === 'hybrid') && rules.length < 6) {
    try {
      const remoteTexts = await hydrateRemoteSources();
      for (const [index, text] of remoteTexts.entries()) {
        const source = REMOTE_SOURCES[index] ?? 'remote';
        sources.push(source);
        rules.push(...extractMarkdownRules(text, source));
      }
    } catch (error) {
      logger.warn('Failed to hydrate remote relationship sources:', error);
    }
  }

  const normalizedRules = rules.length ? rules : DEFAULT_RULES;
  const summary = `Relationship corpus: ${normalizedRules.length} guidance statements loaded.`;
  const corpus: RelationshipCorpus = {
    rules: normalizedRules,
    summary,
    sources: sources.length ? sources : DEFAULT_RULES.map(rule => rule.source),
  };

  corpusCache.set(cacheKey, { data: corpus, expiresAt: Date.now() + cacheTtlMs });
  return corpus;
};

const buildPlanetPlacement = (
  chart: ChartData,
  planet: string
): { sign: string; house: number | null } | null => {
  const placement = chart.planets?.[planet];
  if (!placement) {
    return null;
  }
  return {
    sign: placement.sign,
    house: getHouseNumber(chart.ascendant, placement.sign),
  };
};

const buildCompatibilityNote = (seventhSign?: string | null): string => {
  if (!seventhSign) {
    return 'Compatibility patterns require the ascendant to calculate the 7th house sign.';
  }
  const element = SIGN_ELEMENT[seventhSign];
  const note = COMPATIBILITY_BY_ELEMENT[element];
  return `${seventhSign} as the 7th house highlights ${note}`;
};

const buildPrecisionCheck = (chart: ChartData, seventhLord?: string | null): PrecisionCheckResult => {
  const confirmations: string[] = [];
  const issues: string[] = [];

  if (!chart.ascendant) {
    issues.push('Ascendant is missing; 7th house analysis cannot be verified.');
  } else {
    confirmations.push(`Ascendant verified: ${chart.ascendant}.`);
  }

  if (!seventhLord) {
    issues.push('7th lord could not be derived without the 7th house sign.');
  } else {
    confirmations.push(`7th lord identified as ${seventhLord}.`);
  }

  if (seventhLord && !chart.planets?.[seventhLord]) {
    issues.push(`Planetary placement for ${seventhLord} is missing; review chart data.`);
  } else if (seventhLord) {
    confirmations.push(`${seventhLord} placement available for verification.`);
  }

  if (!chart.planets?.Venus) {
    issues.push('Venus placement missing; harmony indicators may be incomplete.');
  } else {
    confirmations.push('Venus placement available for harmony assessment.');
  }

  if (!chart.planets?.Moon) {
    issues.push('Moon placement missing; emotional compatibility may be incomplete.');
  } else {
    confirmations.push('Moon placement available for emotional tone.');
  }

  return {
    isConsistent: issues.length === 0,
    confirmations,
    issues,
  };
};

const buildRelationshipNarrative = (
  chart: ChartData,
  corpus: RelationshipCorpus
): { subcategories: Record<string, Subcategory>; precision: PrecisionCheckResult } => {
  const ascendant = chart.ascendant;
  const seventhSign = getOppositeSign(ascendant ?? undefined);
  const seventhLord = seventhSign ? RULING_PLANET_BY_SIGN[seventhSign] : null;
  const seventhLordPlacement = seventhLord ? buildPlanetPlacement(chart, seventhLord) : null;
  const venusPlacement = buildPlanetPlacement(chart, 'Venus');
  const moonPlacement = buildPlanetPlacement(chart, 'Moon');
  const rahuPlacement = buildPlanetPlacement(chart, 'Rahu');
  const ketuPlacement = buildPlanetPlacement(chart, 'Ketu');

  const overviewLines: string[] = [];
  const dynamicsLines: string[] = [];
  const karmicLines: string[] = [];

  if (ascendant && seventhSign) {
    overviewLines.push(
      `Ascendant ${ascendant} places the 7th house in ${seventhSign}, indicating ${SEVENTH_HOUSE_TRAITS[seventhSign]}`
    );
  } else {
    overviewLines.push(
      'Ascendant data is required to unlock the full partnership map. Provide exact birth time to analyze the 7th house.'
    );
  }

  if (seventhLord && seventhLordPlacement) {
    dynamicsLines.push(
      `The 7th lord ${seventhLord} is in ${seventhLordPlacement.sign}${seventhLordPlacement.house ? ` (house ${seventhLordPlacement.house})` : ''}, shaping the spouse archetype and partnership responsibilities.`
    );
  }

  if (venusPlacement?.house === 7) {
    dynamicsLines.push(
      'Venus in the 7th house confirms BS-016: harmony, beauty, and mutual affection are central, provided afflictions are minimal.'
    );
  } else if (venusPlacement) {
    dynamicsLines.push(
      `Venus in ${venusPlacement.sign}${venusPlacement.house ? ` (house ${venusPlacement.house})` : ''} highlights how love is expressed; refine expectations to maintain balance.`
    );
  }

  if (moonPlacement) {
    dynamicsLines.push(
      `Moon in ${moonPlacement.sign}${moonPlacement.house ? ` (house ${moonPlacement.house})` : ''} shows emotional needs; nurture shared rhythms for emotional safety.`
    );
  }

  if (seventhLord && chart.planets?.Jupiter?.sign && chart.planets?.Jupiter?.sign === chart.planets?.[seventhLord]?.sign) {
    dynamicsLines.push(
      'Jupiter conjoining the 7th lord aligns with BS-017, indicating a wise, supportive partner and elevated marital dharma.'
    );
  }

  const beneficsInSeventh = ['Jupiter', 'Venus', 'Mercury', 'Moon'].filter(planet => {
    const placement = buildPlanetPlacement(chart, planet);
    return placement?.house === 7;
  });

  if (beneficsInSeventh.length) {
    dynamicsLines.push(
      `Benefics in the 7th (${beneficsInSeventh.join(', ')}) echo BS-019 and favor enduring harmony.`
    );
  }

  if (rahuPlacement?.house === 7 || ketuPlacement?.house === 7 || rahuPlacement?.house === 1 || ketuPlacement?.house === 1) {
    karmicLines.push(
      'Rahu-Ketu on the 1st/7th axis signals karmic bonds and relationships that catalyze soul growth.'
    );
  } else {
    karmicLines.push(
      'Karmic bonds are refined through the 7th house lord and Venus; seek relationships aligned with shared dharma.'
    );
  }

  const relevantRules = corpus.rules.filter(rule =>
    rule.tags.some(tag => ['marriage', 'spouse', 'partner', 'relationship', 'venus', 'moon', '7th'].includes(tag))
  );

  const wisdomNotes = relevantRules.slice(0, 3).map(rule => `• ${rule.text} (${rule.source})`);

  const precision = buildPrecisionCheck(chart, seventhLord);

  const compatibilityNote = buildCompatibilityNote(seventhSign);

  const subcategories: Record<string, Subcategory> = {
    overview: {
      title: 'Relationship Overview',
      content: overviewLines.join(' '),
      data: {
        seventh_house_sign: seventhSign ?? null,
        seventh_lord: seventhLord ?? null,
      },
    },
    partnership_dynamics: {
      title: 'Partnership Dynamics',
      content: dynamicsLines.length
        ? dynamicsLines.join(' ')
        : 'Awaiting complete planetary placements to refine partnership dynamics.',
      data: {
        seventh_lord_placement: seventhLordPlacement,
        venus_placement: venusPlacement,
        moon_placement: moonPlacement,
      },
    },
    compatibility_focus: {
      title: 'Compatibility Focus',
      content: `${compatibilityNote} ${wisdomNotes.length ? `Wisdom cues: ${wisdomNotes.join(' ')}` : ''}`,
      data: {
        element_focus: seventhSign ? SIGN_ELEMENT[seventhSign] : null,
        corpus_summary: corpus.summary,
      },
    },
    karmic_bonds: {
      title: 'Karmic Bonds & Lessons',
      content: karmicLines.join(' '),
      data: {
        rahu_placement: rahuPlacement,
        ketu_placement: ketuPlacement,
      },
    },
    validation: {
      title: 'Precision Check',
      content: [
        precision.confirmations.length
          ? `Confirmed: ${precision.confirmations.join(' ')}`
          : 'Confirmed: none.',
        precision.issues.length ? `Review: ${precision.issues.join(' ')}` : 'Review: none.',
      ].join(' '),
      data: precision,
    },
  };

  return { subcategories, precision };
};

const composeAIInsights = async (
  chart: ChartData,
  subcategories: Record<string, Subcategory>,
  language: string,
  logger: typeof DEFAULT_LOGGER
): Promise<string | null> => {
  try {
    const aiMode = getAIMode();
    if (!aiMode.consent) {
      return null;
    }
    const response = await fetch('/api/ai/compose', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-AI-Consent': 'granted',
        'X-AI-Mode': aiMode.mode,
      },
      body: JSON.stringify({
        report_section: 'relationships',
        language,
        birth_data: {
          zodiac_sign: chart.zodiac_sign,
          moon_sign: chart.moon_sign,
          ascendant: chart.ascendant,
          nakshatra: chart.nakshatra,
          planetary_positions: chart.planets,
          houses: chart.houses,
        },
        existing_sections: subcategories,
      }),
    });

    if (!response.ok) {
      throw new Error(`AI compose failed: ${response.statusText}`);
    }

    const aiResponse = await response.json();
    const refined = aiResponse?.data?.refined_section ?? null;
    return isSectionContentValid(refined) ? refined : null;
  } catch (error) {
    logger.warn('AI relationship insight failed:', error);
    return null;
  }
};

export const generateRelationshipsPrediction = async (
  chart: ChartData,
  options: RelationshipsEngineOptions = {}
): Promise<PredictionResult> => {
  const mode = options.mode ?? 'offline';
  const useAI = options.useAI ?? true;
  const cacheTtlMs = options.cacheTtlMs ?? DEFAULT_CACHE_TTL;
  const logger = options.logger ?? DEFAULT_LOGGER;
  const cacheKey = buildCacheKey(chart, mode, useAI);

  const cached = predictionCache.get(cacheKey);
  if (cached && cached.expiresAt > Date.now()) {
    return cached.data;
  }

  const corpus = await loadRelationshipCorpus(mode, cacheTtlMs, logger);
  const { subcategories, precision } = buildRelationshipNarrative(chart, corpus);

  const metadata: PredictionMetadata = {
    engine: 'relationships',
    zodiac_sign: chart.zodiac_sign ?? 'Unknown',
    moon_sign: chart.moon_sign ?? 'Unknown',
    ascendant: chart.ascendant ?? 'Unknown',
    nakshatra: chart.nakshatra ?? 'Unknown',
    ai_enhanced: false,
    tradition: 'Bhrigu Samhita & Nadi Jyotisa',
    calculation_method: 'Two-phase: 7th house analysis + precision validation',
  };

  let aiSynthesis: string | undefined;
  if (useAI && (mode === 'online' || mode === 'hybrid')) {
    aiSynthesis = (await composeAIInsights(chart, subcategories, options.language ?? 'en', logger)) ?? undefined;
    if (aiSynthesis) {
      metadata.ai_enhanced = true;
    }
  }

  const result: PredictionResult = {
    engine: 'relationships',
    title: 'Relationships & Soul Connections',
    success: precision.isConsistent || precision.issues.length === 0,
    subcategories,
    ai_synthesis: aiSynthesis,
    metadata,
    generated_at: new Date().toISOString(),
    mode,
    error: precision.issues.length
      ? 'Some relationship indicators require additional chart data. Review the precision check.'
      : undefined,
  };

  predictionCache.set(cacheKey, { data: result, expiresAt: Date.now() + cacheTtlMs });
  return result;
};
