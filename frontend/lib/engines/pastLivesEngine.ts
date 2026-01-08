import type { ChartData, PredictionMetadata, PredictionResult, Subcategory } from '../api/predictions';

type PastLivesMode = 'offline' | 'online' | 'auto';

type PastLivesLogger = Pick<Console, 'debug' | 'info' | 'warn' | 'error'>;

interface PastLivesEngineOptions {
  mode?: PastLivesMode;
  aiEnabled?: boolean;
  cacheTTLms?: number;
  logger?: PastLivesLogger;
}

interface PastLivesRule {
  text: string;
  tags: string[];
  source: string;
}

interface PastLivesCorpus {
  rules: PastLivesRule[];
  summary: string;
  sources: string[];
}

interface PastLivesNarrative {
  mostRecent: string;
  karmicPatterns: string;
  reincarnationCycle: string;
  karmicDebts: string;
  carryoverGifts: string;
  unfinishedVows: string;
  healingPath: string;
  aiSynthesis?: string;
}

interface PrecisionCheckResult {
  isConsistent: boolean;
  confirmations: string[];
  issues: string[];
}

const DEFAULT_CACHE_TTL = 1000 * 60 * 5;
const cache = new Map<string, { expiresAt: number; result: PredictionResult }>();
const fallbackSummary =
  'Offline corpus unavailable. Applying synthesized Bhrigu Samhita and Nadi Jyotisa principles based on lunar sign, ascendant, and nodal axis to infer past-life karmic patterns.';

const DEFAULT_RULES: PastLivesRule[] = [
  {
    text: 'Moon sign anchors emotional memory; its element describes the dominant samskara carried forward from the most recent incarnation.',
    tags: ['moon', 'memory', 'samskara'],
    source: 'Synthesized Bhrigu Samhita',
  },
  {
    text: 'Rahu indicates the future-facing karmic appetite, while Ketu reveals the mastered skills and attachments from prior lives.',
    tags: ['rahu', 'ketu', 'nodes', 'karmic'],
    source: 'Synthesized Nadi Jyotisa',
  },
  {
    text: 'Ascendant and its lord describe the soul’s chosen role and the stage of refinement in this life cycle.',
    tags: ['ascendant', 'lagna', 'role'],
    source: 'Synthesized Bhrigu Samhita',
  },
  {
    text: 'Saturn connections expose debts of responsibility and unfinished duties; Jupiter aspects highlight past merit and spiritual support.',
    tags: ['saturn', 'jupiter', 'debt', 'merit'],
    source: 'Synthesized Nadi Jyotisa',
  },
];

const SIGN_ARCHETYPES: Record<string, string> = {
  Aries: 'warrior-healer archetype, decisive leadership in prior conflicts',
  Taurus: 'steward of resources, refinement of values and guardianship of wealth',
  Gemini: 'messenger or scribe, weaving networks of knowledge and trade',
  Cancer: 'caretaker lineage, ancestral duty and emotional protection',
  Leo: 'royal or ceremonial leader, learning humility alongside authority',
  Virgo: 'artisan-healer, perfecting skill through service and routine',
  Libra: 'diplomat-artist, balancing justice, beauty, and partnership karma',
  Scorpio: 'mystic-transformer, navigating power, secrecy, and rebirth',
  Sagittarius: 'pilgrim-scholar, pursuing truth across distant lands',
  Capricorn: 'builder-steward, mastering responsibility and worldly structures',
  Aquarius: 'reformer-visionary, advancing collective missions and innovations',
  Pisces: 'seer-compassionate, dissolving ego through spiritual devotion',
};

const ELEMENTAL_TONES: Record<string, string> = {
  fire: 'bold initiative, karmic lessons around courage and restraint',
  earth: 'steadfast service, karma tied to duty, stability, and material stewardship',
  air: 'mental agility, karmic patterns of ideas, teaching, and detachment',
  water: 'emotional depth, karma of intimacy, empathy, and ancestral memory',
};

const SIGN_ELEMENTS: Record<string, keyof typeof ELEMENTAL_TONES> = {
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

const RULE_KEYWORDS = ['moon', 'rahu', 'ketu', 'nodes', 'ascendant', 'lagna', 'saturn', 'jupiter', 'nakshatra'];

const DEFAULT_LOGGER: PastLivesLogger = {
  debug: (...args) => console.debug('[PastLivesEngine]', ...args),
  info: (...args) => console.info('[PastLivesEngine]', ...args),
  warn: (...args) => console.warn('[PastLivesEngine]', ...args),
  error: (...args) => console.error('[PastLivesEngine]', ...args),
};

const TEXT_FILES = [
  'docs/BhriguSamhita.md',
  'docs/NadiJyotisa.md',
  'docs/bhrigu_samhita_jyotish_engine.md',
  'docs/bhrigu_samhita_enhancements.md',
  'docs/bhrigu_references.md',
  'backend/data/bhrigu_samhita_principles.yml',
  'backend/data/nadi_jyotisha_principles.yml',
];

const safeLower = (value?: string) => value?.toLowerCase() ?? '';

const titleCase = (value?: string) =>
  value ? value.charAt(0).toUpperCase() + value.slice(1).toLowerCase() : 'Unknown';

const getCachedResult = (cacheKey: string): PredictionResult | null => {
  const cached = cache.get(cacheKey);
  if (!cached) {
    return null;
  }
  if (cached.expiresAt <= Date.now()) {
    cache.delete(cacheKey);
    return null;
  }
  return cached.result;
};

const setCachedResult = (cacheKey: string, result: PredictionResult, ttl: number) => {
  cache.set(cacheKey, { expiresAt: Date.now() + ttl, result });
};

const buildCacheKey = (chart: ChartData, mode: PastLivesMode, aiEnabled: boolean) =>
  JSON.stringify({
    mode,
    aiEnabled,
    date: chart.date_of_birth,
    time: chart.time_of_birth,
    place: chart.place_of_birth,
    moon: chart.moon_sign,
    ascendant: chart.ascendant,
    nakshatra: chart.nakshatra,
  });

const isServer = () => typeof window === 'undefined';

const loadTextFile = async (path: string): Promise<string | null> => {
  if (!isServer()) {
    return null;
  }

  try {
    const fs = await import('fs/promises');
    const content = await fs.readFile(path, 'utf8');
    return content;
  } catch {
    return null;
  }
};

const parseMarkdownRules = (text: string, source: string): PastLivesRule[] => {
  const sentences = text
    .replace(/\r/g, '')
    .split(/(?<=[.!?])\s+/)
    .map(sentence => sentence.trim())
    .filter(sentence => sentence.length > 60);

  return sentences
    .filter(sentence => RULE_KEYWORDS.some(keyword => sentence.toLowerCase().includes(keyword)))
    .slice(0, 30)
    .map(sentence => ({
      text: sentence,
      tags: RULE_KEYWORDS.filter(keyword => sentence.toLowerCase().includes(keyword)),
      source,
    }));
};

const parseYamlDescriptions = (text: string, source: string): PastLivesRule[] => {
  const rules: PastLivesRule[] = [];
  const quoted = /description:\s*"([^"]+)"/g;
  const unquoted = /description:\s*([^\n]+)/g;

  let match = quoted.exec(text);
  while (match) {
    rules.push({
      text: match[1].trim(),
      tags: RULE_KEYWORDS.filter(keyword => match[1].toLowerCase().includes(keyword)),
      source,
    });
    match = quoted.exec(text);
  }

  match = unquoted.exec(text);
  while (match) {
    if (!match[1].includes('"')) {
      rules.push({
        text: match[1].trim(),
        tags: RULE_KEYWORDS.filter(keyword => match[1].toLowerCase().includes(keyword)),
        source,
      });
    }
    match = unquoted.exec(text);
  }

  return rules;
};

const buildCorpusSummary = (rules: PastLivesRule[]) => {
  const uniqueSources = Array.from(new Set(rules.map(rule => rule.source)));
  const tagCounts = rules.reduce<Record<string, number>>((acc, rule) => {
    rule.tags.forEach(tag => {
      acc[tag] = (acc[tag] ?? 0) + 1;
    });
    return acc;
  }, {});

  const summary = `Parsed ${rules.length} textual cues from ${uniqueSources.length} local sources. Dominant themes: ${Object.entries(tagCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 4)
    .map(([tag]) => tag)
    .join(', ')}.`;

  return { summary, sources: uniqueSources };
};

const loadOfflineCorpus = async (logger: PastLivesLogger): Promise<PastLivesCorpus> => {
  const rules: PastLivesRule[] = [];
  const sources: string[] = [];

  for (const file of TEXT_FILES) {
    const content = await loadTextFile(file);
    if (!content) {
      continue;
    }
    sources.push(file);
    if (file.endsWith('.yml')) {
      rules.push(...parseYamlDescriptions(content, file));
    } else {
      rules.push(...parseMarkdownRules(content, file));
    }
  }

  if (!rules.length) {
    logger.warn('No offline corpus found; using synthesized defaults.');
    return {
      rules: DEFAULT_RULES,
      summary: fallbackSummary,
      sources: ['Synthesized offline corpus'],
    };
  }

  const { summary, sources: parsedSources } = buildCorpusSummary(rules);

  return {
    rules: rules.length ? rules : DEFAULT_RULES,
    summary,
    sources: parsedSources.length ? parsedSources : sources,
  };
};

const getSignElement = (sign?: string) => {
  const normalized = titleCase(sign);
  return SIGN_ELEMENTS[normalized] ?? 'air';
};

const buildNarrative = (chart: ChartData, corpus: PastLivesCorpus): PastLivesNarrative => {
  const moonSign = titleCase(chart.moon_sign || chart.zodiac_sign);
  const ascendant = titleCase(chart.ascendant);
  const nakshatra = titleCase(chart.nakshatra);
  const rahuSign = titleCase(chart.planets?.Rahu?.sign);
  const ketuSign = titleCase(chart.planets?.Ketu?.sign);
  const element = getSignElement(moonSign);
  const archetype = SIGN_ARCHETYPES[moonSign] ?? 'soul pilgrim refining wisdom through contrast';
  const elementTone = ELEMENTAL_TONES[element];

  const ruleMatches = corpus.rules.filter(rule => {
    const text = safeLower(rule.text);
    return [moonSign, ascendant, nakshatra, rahuSign, ketuSign].some(value =>
      value && text.includes(value.toLowerCase())
    );
  });

  const selectedRules = ruleMatches.length ? ruleMatches.slice(0, 4) : corpus.rules.slice(0, 4);
  const ruleHighlights = selectedRules.map(rule => `• ${rule.text}`).join('\n');

  return {
    mostRecent: `Most Recent Past Life aligns with ${archetype}. The Moon in ${moonSign} signifies ${elementTone}, suggesting a final incarnation centered on ${moonSign.toLowerCase()}-style duties and emotional imprints. Rahu in ${rahuSign} and Ketu in ${ketuSign} indicate the soul pivoting from familiar ${ketuSign.toLowerCase()} patterns toward ${rahuSign.toLowerCase()} aspirations.`,
    karmicPatterns: `Recurring karmic patterns appear in the ${element} element: ${elementTone}. Ascendant ${ascendant} shapes the soul role, while nakshatra ${nakshatra} preserves ritual memory and instinct.\n\nTextual cues:\n${ruleHighlights}`,
    reincarnationCycle: `The reincarnation cycle shows a gradual shift from Ketu-led mastery (${ketuSign}) to Rahu-led evolution (${rahuSign}). This suggests repeated lifetimes where the soul refined ${ketuSign.toLowerCase()} disciplines before choosing ${rahuSign.toLowerCase()} learning arcs in this birth.`,
    karmicDebts: `Saturn-linked duties show areas of unfinished responsibility. Expect debts around duty, time management, or caretaking if Saturn is emphasized; Jupiter-linked grace balances these debts with merit. The ${moonSign} lunar imprint suggests the debt is repaid through emotionally mature service and alignment with dharma.`,
    carryoverGifts: `Carryover gifts include ${ketuSign.toLowerCase()}-based mastery, ${ascendant.toLowerCase()} leadership skills, and ${nakshatra.toLowerCase()}-based intuition. These gifts stabilize the soul while confronting Rahu-driven growth.`,
    unfinishedVows: `Unfinished vows relate to the Rahu axis: commitments to explore ${rahuSign.toLowerCase()} experiences while releasing overly comfortable ${ketuSign.toLowerCase()} routines. Rituals or service tied to ${nakshatra} restore continuity across incarnations.`,
    healingPath: `Healing path: honor the Moon sign by regulating emotions, practice detachment where Ketu over-identifies, and embrace Rahu’s unfamiliar terrain. Combine mantra, seva, and conscious relationship repair to resolve karmic loops.`,
  };
};

const buildPrecisionCheck = (chart: ChartData, narrative: PastLivesNarrative): PrecisionCheckResult => {
  const confirmations: string[] = [];
  const issues: string[] = [];

  const moonSign = titleCase(chart.moon_sign || chart.zodiac_sign);
  const ascendant = titleCase(chart.ascendant);
  const rahuSign = titleCase(chart.planets?.Rahu?.sign);
  const ketuSign = titleCase(chart.planets?.Ketu?.sign);

  if (narrative.mostRecent.includes(moonSign)) {
    confirmations.push(`Moon sign (${moonSign}) referenced for emotional memory.`);
  } else {
    issues.push('Moon sign missing from narrative; lunar memory alignment unclear.');
  }

  if (narrative.karmicPatterns.includes(ascendant)) {
    confirmations.push(`Ascendant (${ascendant}) used to define the soul role.`);
  } else {
    issues.push('Ascendant not reinforced in karmic patterns section.');
  }

  if (narrative.reincarnationCycle.includes(rahuSign) && narrative.reincarnationCycle.includes(ketuSign)) {
    confirmations.push(`Rahu (${rahuSign}) and Ketu (${ketuSign}) axis validated.`);
  } else {
    issues.push('Rahu/Ketu axis not fully represented in reincarnation cycle.');
  }

  if (chart.planets?.Saturn) {
    confirmations.push('Saturn placement acknowledged for karmic debt context.');
  } else {
    issues.push('Saturn position unavailable; debt assessment generalized.');
  }

  if (chart.planets?.Jupiter) {
    confirmations.push('Jupiter placement acknowledged for merit balance.');
  } else {
    issues.push('Jupiter position unavailable; merit assessment generalized.');
  }

  return {
    isConsistent: issues.length === 0,
    confirmations,
    issues,
  };
};

const buildSubcategories = (
  narrative: PastLivesNarrative,
  precision: PrecisionCheckResult,
  corpus: PastLivesCorpus
): Record<string, Subcategory> => ({
  most_recent_past_life: {
    title: 'Most Recent Past Life',
    content: narrative.mostRecent,
  },
  karmic_patterns: {
    title: 'Karmic Patterns',
    content: narrative.karmicPatterns,
  },
  reincarnation_cycle: {
    title: 'Reincarnation Cycle',
    content: narrative.reincarnationCycle,
  },
  karmic_debts: {
    title: 'Karmic Debts & Credits',
    content: narrative.karmicDebts,
  },
  carryover_gifts: {
    title: 'Carryover Gifts',
    content: narrative.carryoverGifts,
  },
  unfinished_vows: {
    title: 'Unfinished Vows',
    content: narrative.unfinishedVows,
  },
  healing_path: {
    title: 'Healing Path',
    content: narrative.healingPath,
  },
  precision_check: {
    title: 'Precision Check',
    content: `${precision.isConsistent ? '✅ All Jyotisa checks aligned.' : '⚠️ Some Jyotisa checks need review.'}\n\nConfirmations:\n${precision.confirmations
      .map(item => `• ${item}`)
      .join('\n')}\n\nFlags:\n${precision.issues.length ? precision.issues.map(item => `• ${item}`).join('\n') : '• None'}`,
    data: precision,
  },
  sources_summary: {
    title: 'Ancient Wisdom Sources',
    content: `${corpus.summary}\n\nSources:\n${corpus.sources.map(source => `• ${source}`).join('\n')}`,
  },
});

const buildMetadata = (chart: ChartData, aiEnhanced: boolean): PredictionMetadata => ({
  engine: 'past_lives',
  zodiac_sign: chart.zodiac_sign ?? 'Unknown',
  moon_sign: chart.moon_sign ?? chart.zodiac_sign ?? 'Unknown',
  ascendant: chart.ascendant ?? 'Unknown',
  nakshatra: chart.nakshatra ?? 'Unknown',
  ai_enhanced: aiEnhanced,
  tradition: 'Bhrigu Samhita & Nadi Jyotisa',
  calculation_method: 'Two-phase past-life synthesis with Jyotisa validation',
});

const buildPredictionResult = (
  chart: ChartData,
  narrative: PastLivesNarrative,
  precision: PrecisionCheckResult,
  corpus: PastLivesCorpus,
  aiEnhanced: boolean,
  mode: PastLivesMode
): PredictionResult => ({
  engine: 'past_lives',
  title: 'Past Lives Analysis',
  success: true,
  subcategories: buildSubcategories(narrative, precision, corpus),
  ai_synthesis: narrative.aiSynthesis,
  metadata: buildMetadata(chart, aiEnhanced),
  generated_at: new Date().toISOString(),
  mode,
});

const fetchOnlinePrediction = async (chart: ChartData, logger: PastLivesLogger): Promise<PredictionResult | null> => {
  try {
    const response = await fetch('/api/predictions/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        engine: 'past_lives',
        birth_data: chart,
        use_ai: true,
        language: 'en',
      }),
    });

    if (!response.ok) {
      logger.warn('Online prediction fetch failed', response.statusText);
      return null;
    }

    const data = (await response.json()) as PredictionResult;
    return data;
  } catch (error) {
    logger.warn('Online prediction fetch error', error);
    return null;
  }
};

export const generatePastLivesPrediction = async (
  chart: ChartData,
  options: PastLivesEngineOptions = {}
): Promise<PredictionResult> => {
  const mode = options.mode ?? 'auto';
  const aiEnabled = options.aiEnabled ?? true;
  const cacheTTL = options.cacheTTLms ?? DEFAULT_CACHE_TTL;
  const logger = options.logger ?? DEFAULT_LOGGER;

  const cacheKey = buildCacheKey(chart, mode, aiEnabled);
  const cached = getCachedResult(cacheKey);
  if (cached) {
    logger.debug('Returning cached past lives prediction.');
    return cached;
  }

  const corpus = await loadOfflineCorpus(logger);
  const narrative = buildNarrative(chart, corpus);

  if (aiEnabled && (mode === 'online' || mode === 'auto')) {
    const onlineResult = await fetchOnlinePrediction(chart, logger);
    if (onlineResult?.success) {
      narrative.aiSynthesis = onlineResult.ai_synthesis || onlineResult.subcategories?.ai_synthesis?.content;
    }
  }

  const precision = buildPrecisionCheck(chart, narrative);
  const result = buildPredictionResult(chart, narrative, precision, corpus, aiEnabled, mode);
  setCachedResult(cacheKey, result, cacheTTL);
  return result;
};
