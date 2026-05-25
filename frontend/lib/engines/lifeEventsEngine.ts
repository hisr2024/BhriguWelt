'use client';

/**
 * Life Events Prediction Engine
 *
 * Offline-first: deterministic calculations with optional AI refinement, no secrets required.
 */
import type {
  ChartData,
  LifeEvent,
  PredictionMetadata,
  PredictionResult,
  Subcategory,
} from '../api/predictions';
import { getAIMode } from '@/lib/ai-preferences';
import { isSectionContentValid } from '../sectionParserConfig';

type LifeEventsMode = 'offline' | 'online' | 'hybrid';

type LifeEventsLogger = Pick<Console, 'debug' | 'info' | 'warn' | 'error'>;

export interface LifeEventsOptions {
  mode?: LifeEventsMode;
  useAI?: boolean;
  language?: 'en' | 'hi' | 'sa';
  cacheTtlMs?: number;
  aiMode?: { mode: string; consent: boolean };
  logger?: LifeEventsLogger;
}

interface PanchangContext {
  tithi?: string;
  nakshatra?: string;
  weekday?: string;
  lunar_month?: string;
}

interface LifeEventRule {
  id: string;
  source: string;
  text: string;
  tags: string[];
  panchang?: PanchangContext;
}

interface LifeEventsCorpus {
  rules: LifeEventRule[];
  summaries: string[];
  sources: string[];
}

interface LifeEventDetail extends LifeEvent {
  category: string;
  ageRange: string;
  confidenceScore: number;
  ruleRefs: LifeEventRule[];
}

interface PrecisionCheckResult {
  confirmed: string[];
  issues: string[];
  adjustedEvents: LifeEventDetail[];
  panchangMatches: string[];
}

interface CacheEntry<T> {
  data: T;
  expiresAt: number;
}

const DEFAULT_CACHE_TTL = 15 * 60 * 1000; // 15 minutes for better caching
const RULE_CACHE = new Map<string, CacheEntry<LifeEventsCorpus>>();
const RESULT_CACHE = new Map<string, CacheEntry<PredictionResult>>();

const DEFAULT_LOGGER: LifeEventsLogger = {
  debug: (...args) => console.debug('[LifeEventsEngine]', ...args),
  info: (...args) => console.info('[LifeEventsEngine]', ...args),
  warn: (...args) => console.warn('[LifeEventsEngine]', ...args),
  error: (...args) => console.error('[LifeEventsEngine]', ...args),
};

const EVENT_KEYWORDS: Record<string, string[]> = {
  marriage: ['marriage', 'spouse', 'partnership', 'relationship', 'union'],
  career: ['career', 'profession', 'work', 'authority', 'leadership', 'command'],
  finance: ['wealth', 'prosperity', 'finance', 'income', 'gains', 'resources'],
  health: ['health', 'disease', 'illness', 'recovery', 'vitality'],
  transition: ['transition', 'transformation', 'rebirth', 'change', 'detachment'],
  risk: ['risk', 'setback', 'obstacle', 'delay', 'challenge', 'affliction'],
  success: ['success', 'achievement', 'recognition', 'honor', 'victory'],
  spiritual: ['spiritual', 'dharma', 'moksha', 'meditation', 'pilgrimage'],
  children: ['children', 'progeny', 'child', 'fertility', 'legacy'],
};

const MALEFICS = new Set(['Saturn', 'Mars', 'Rahu', 'Ketu']);
const DUSTHANA_HOUSES = new Set([6, 8, 12]);

const TIMING_RULES: Record<string, string> = {
  marriage: 'Dasha/antardasha of the 7th lord or Venus; Jupiter transit through 7th from Moon for culmination.',
  career: 'Dasha of the 10th lord with Jupiter/Saturn transits over the 10th or its lord.',
  finance: 'Dasha of the 2nd/11th lords with Jupiter aspects to wealth houses.',
  health: 'Dasha of the 6th/8th lords or malefic transits over 6th/8th/12th houses.',
  transition: 'Nodes or Saturn moving through 8th/12th houses; dasha shifts of lagna lord.',
  success: 'Jupiter or Mars dashas when supported by 10th/11th house activations.',
  spiritual: 'Ketu/Jupiter dashas tied to the 9th/12th houses or moksha nakshatras.',
  children: 'Dasha/antardasha of 5th lord or Jupiter activating the 5th house.',
};

const REMOTE_RULE_SOURCES = [
  'https://raw.githubusercontent.com/hisr2024/BhriguWelt/main/core_wisdom/bhrigu_samhita_rules.md',
  'https://raw.githubusercontent.com/hisr2024/BhriguWelt/main/core_wisdom/nadi_jyotisha_rules.md',
  'https://raw.githubusercontent.com/hisr2024/BhriguWelt/main/docs/bhrigu_samhita_enhancements.md',
  'https://raw.githubusercontent.com/hisr2024/BhriguWelt/main/backend/data/bhrigu_samhita_principles.yml',
];

const RULE_FILE_PATHS = [
  'core_wisdom/bhrigu_samhita_rules.md',
  'core_wisdom/nadi_jyotisha_rules.md',
  'docs/bhrigu_samhita_enhancements.md',
  'backend/data/bhrigu_samhita_principles.yml',
];

const DEFAULT_RULES: LifeEventRule[] = [
  {
    id: 'BS-041',
    source: 'Synthesized Bhrigu Samhita',
    text: 'The dasha of the 10th lord brings professional authority and notable career milestones.',
    tags: ['career', 'success'],
  },
  {
    id: 'BS-042',
    source: 'Synthesized Bhrigu Samhita',
    text: 'The dasha of the 7th lord or Venus often coincides with marriage or pivotal partnerships.',
    tags: ['marriage'],
  },
  {
    id: 'BS-043',
    source: 'Synthesized Bhrigu Samhita',
    text: 'The dasha of the 2nd lord activates wealth-building and family transitions.',
    tags: ['finance', 'transition'],
  },
  {
    id: 'ND-062',
    source: 'Synthesized Nadi Jyotisha',
    text: 'Marriage timing intensifies during dasha-antardasha of nakshatra lords connected to the 7th house.',
    tags: ['marriage'],
  },
  {
    id: 'ND-064',
    source: 'Synthesized Nadi Jyotisha',
    text: 'Jupiter transiting the natal Moon nakshatra yields emotional blessings and expansion.',
    tags: ['success', 'spiritual'],
  },
  {
    id: 'ND-065',
    source: 'Synthesized Nadi Jyotisha',
    text: 'Saturn transits through the natal Sun nakshatra highlight discipline and risk management.',
    tags: ['risk', 'transition'],
  },
];

const normalize = (value?: string): string => value?.toLowerCase() ?? '';

const isCacheValid = (entry?: CacheEntry<unknown>): boolean => !!entry && Date.now() < entry.expiresAt;

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

const buildCacheKey = (chart: ChartData, mode: LifeEventsMode, aiEnabled: boolean): string =>
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

const isServer = (): boolean => typeof window === 'undefined';

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

const parseRulesFromMarkdown = (text: string, source: string): LifeEventRule[] => {
  const ruleRegex = /\*\*Rule\s+([A-Z]{2}-\d{3})\*\*:\s*([^\n]+)/g;
  const rules: LifeEventRule[] = [];
  let match: RegExpExecArray | null;

  while ((match = ruleRegex.exec(text)) !== null) {
    const id = match[1] ?? '';
    const ruleText = match[2]?.trim() ?? '';
    rules.push({
      id,
      source,
      text: ruleText,
      tags: deriveTags(ruleText),
    });
  }

  return rules;
};

const parseEnhancementLifeEvents = (text: string, source: string): LifeEventRule[] => {
  const lines = text.split(/\r?\n/);
  const rules: LifeEventRule[] = [];
  const categoryStart = lines.findIndex(line => line.includes('Life Events Analyzer'));

  if (categoryStart < 0) {
    return rules;
  }

  const slice = lines.slice(categoryStart, categoryStart + 40);
  slice.forEach(line => {
    const match = line.match(/\*\*([^*]+)\*\*:/);
    if (match) {
      const cleaned = line.replace(/\*\*/g, '').trim();
      rules.push({
        id: `LE-${rules.length + 1}`,
        source,
        text: cleaned,
        tags: deriveTags(cleaned),
      });
    }
  });

  return rules;
};

const parseBhriguPrinciples = (data: string, source: string): LifeEventRule[] => {
  try {
    const parsed = JSON.parse(data) as {
      principles?: Array<{
        id?: string;
        sutra_reference?: string;
        description?: string;
        panchang_context?: PanchangContext;
      }>;
    };

    return (parsed.principles ?? [])
      .filter(principle => principle.id && principle.description)
      .map(principle => ({
        id: principle.id!,
        source: principle.sutra_reference ?? source,
        text: principle.description!,
        tags: deriveTags(principle.description ?? ''),
        panchang: principle.panchang_context,
      }));
  } catch {
    return [];
  }
};

const deriveTags = (text: string): string[] => {
  const normalized = normalize(text);
  return Object.entries(EVENT_KEYWORDS)
    .filter(([, keywords]) => keywords.some(keyword => normalized.includes(keyword)))
    .map(([tag]) => tag);
};

const summarizeRules = (rules: LifeEventRule[]): string[] => {
  const summaries: string[] = [];
  const categoryCounts = rules.reduce<Record<string, number>>((acc, rule) => {
    rule.tags.forEach(tag => {
      acc[tag] = (acc[tag] ?? 0) + 1;
    });
    return acc;
  }, {});

  Object.entries(categoryCounts).forEach(([tag, count]) => {
    summaries.push(`${tag}: ${count} rules`);
  });

  return summaries;
};

const loadLocalRules = async (logger: LifeEventsLogger): Promise<LifeEventRule[]> => {
  const rules: LifeEventRule[] = [];

  for (const filePath of RULE_FILE_PATHS) {
    const candidates = [
      filePath,
      `frontend/${filePath}`,
      `../${filePath}`,
    ];

    let content: string | null = null;
    for (const candidate of candidates) {
      content = await loadTextFile(candidate);
      if (content) {
        break;
      }
    }

    if (!content) {
      continue;
    }

    if (filePath.endsWith('bhrigu_samhita_principles.yml')) {
      rules.push(...parseBhriguPrinciples(content, filePath));
      continue;
    }

    if (filePath.includes('bhrigu_samhita_enhancements')) {
      rules.push(...parseEnhancementLifeEvents(content, filePath));
    }

    rules.push(...parseRulesFromMarkdown(content, filePath));
  }

  logger.debug('Loaded local life event rules:', rules.length);
  return rules;
};

const fetchRemoteRules = async (logger: LifeEventsLogger): Promise<LifeEventRule[]> => {
  const rules: LifeEventRule[] = [];

  for (const url of REMOTE_RULE_SOURCES) {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 3000); // 3s timeout
      const response = await fetch(url, { signal: controller.signal });
      clearTimeout(timeoutId);
      if (!response.ok) {
        continue;
      }
      const text = await response.text();
      if (url.endsWith('.yml')) {
        rules.push(...parseBhriguPrinciples(text, url));
      } else {
        rules.push(...parseRulesFromMarkdown(text, url));
        if (url.includes('bhrigu_samhita_enhancements')) {
          rules.push(...parseEnhancementLifeEvents(text, url));
        }
      }
    } catch (error) {
      logger.warn('Remote rule fetch failed', url, error);
    }
  }

  return rules;
};

const loadLifeEventCorpus = async (mode: LifeEventsMode, logger: LifeEventsLogger): Promise<LifeEventsCorpus> => {
  const cacheKey = `life-events-${mode}`;
  const cached = RULE_CACHE.get(cacheKey);
  if (isCacheValid(cached)) {
    return cached!.data;
  }

  const localRules = await loadLocalRules(logger);
  let rules = [...localRules];
  const sources = new Set(localRules.map(rule => rule.source));

  if ((mode === 'online' || mode === 'hybrid') && rules.length < 8) {
    const remoteRules = await fetchRemoteRules(logger);
    rules = [...rules, ...remoteRules];
    remoteRules.forEach(rule => sources.add(rule.source));
  }

  if (!rules.length) {
    rules = [...DEFAULT_RULES];
    DEFAULT_RULES.forEach(rule => sources.add(rule.source));
  }

  const corpus: LifeEventsCorpus = {
    rules,
    summaries: summarizeRules(rules),
    sources: Array.from(sources),
  };

  RULE_CACHE.set(cacheKey, { data: corpus, expiresAt: Date.now() + DEFAULT_CACHE_TTL });
  return corpus;
};

const selectRules = (rules: LifeEventRule[], category: string, limit = 3): LifeEventRule[] => {
  const matches = rules.filter(rule => rule.tags.includes(category));
  return matches.slice(0, limit);
};

const calculateProbabilityLabel = (score: number): 'High' | 'Moderate' | 'Low' => {
  if (score >= 2.5) {
    return 'High';
  }
  if (score >= 1.25) {
    return 'Moderate';
  }
  return 'Low';
};

const buildAgeRange = (baseStart: number, baseEnd: number, offset: number): string => {
  const start = baseStart + offset;
  const end = baseEnd + offset;
  return `Ages ${start}-${end}`;
};

const buildLifeEventDetail = (
  category: string,
  baseDescription: string,
  score: number,
  ageRange: string,
  rules: LifeEventRule[]
): LifeEventDetail => ({
  period: category,
  timing: TIMING_RULES[category] ?? 'Major dasha/antardasha and transits.',
  description: baseDescription,
  probability: calculateProbabilityLabel(score),
  category,
  ageRange,
  confidenceScore: score,
  ruleRefs: rules,
});

const buildEventTimeline = (chart: ChartData, rules: LifeEventRule[]): LifeEventDetail[] => {
  const planetHouses = resolvePlanetHouses(chart);
  const events: LifeEventDetail[] = [];

  const marriageRules = selectRules(rules, 'marriage');
  let marriageScore = 1;
  let marriageOffset = 0;
  const marriageNotes: string[] = ['Partnership themes highlighted by Bhrigu/Nadi marriage sutras.'];

  if (planetHouses.Venus === 7 || planetHouses.Jupiter === 7) {
    marriageScore += 1.5;
    marriageOffset -= 2;
    marriageNotes.push('Venus/Jupiter in the 7th house accelerates committed partnership timing.');
  }
  if (planetHouses.Saturn === 7 || planetHouses.Rahu === 7 || planetHouses.Ketu === 7) {
    marriageScore -= 0.5;
    marriageOffset += 3;
    marriageNotes.push('Saturn/Rahu/Ketu influence on the 7th house can delay or demand maturity.');
  }

  events.push(
    buildLifeEventDetail(
      'marriage',
      `${marriageNotes.join(' ')}
Key Sutras: ${marriageRules.map(rule => rule.id).join(', ') || 'N/A'}.`,
      marriageScore,
      buildAgeRange(24, 30, marriageOffset),
      marriageRules
    )
  );

  const careerRules = selectRules(rules, 'career');
  let careerScore = 1.2;
  let careerOffset = 0;
  const careerNotes: string[] = ['Career consolidation follows 10th house and Mars/Jupiter activations.'];

  if (planetHouses.Sun === 10 || planetHouses.Mars === 10) {
    careerScore += 1.2;
    careerNotes.push('Sun/Mars in the 10th indicates decisive leadership breakthroughs.');
  }
  if (planetHouses.Saturn === 10) {
    careerScore += 0.6;
    careerOffset += 2;
    careerNotes.push('Saturn in the 10th adds slow but authoritative rise.');
  }

  events.push(
    buildLifeEventDetail(
      'career',
      `${careerNotes.join(' ')}
Key Sutras: ${careerRules.map(rule => rule.id).join(', ') || 'N/A'}.`,
      careerScore,
      buildAgeRange(28, 36, careerOffset),
      careerRules
    )
  );

  const financeRules = selectRules(rules, 'finance');
  let financeScore = 1;
  let financeOffset = 0;
  const financeNotes: string[] = ['Wealth indicators emerge through 2nd/11th house strength.'];

  if (planetHouses.Jupiter === 2 || planetHouses.Jupiter === 11) {
    financeScore += 1.4;
    financeNotes.push('Jupiter in wealth houses supports expansive gains.');
  }
  if (planetHouses.Saturn === 2) {
    financeScore += 0.4;
    financeOffset += 3;
    financeNotes.push('Saturn in the 2nd delays but stabilizes wealth accumulation.');
  }

  events.push(
    buildLifeEventDetail(
      'finance',
      `${financeNotes.join(' ')}
Key Sutras: ${financeRules.map(rule => rule.id).join(', ') || 'N/A'}.`,
      financeScore,
      buildAgeRange(30, 38, financeOffset),
      financeRules
    )
  );

  const healthRules = selectRules(rules, 'health');
  let healthScore = 0.8;
  const healthNotes: string[] = ['Health vigilance follows 6th/8th/12th house activations.'];
  const healthMalefics = Object.entries(planetHouses)
    .filter(([planet, house]) => house && DUSTHANA_HOUSES.has(house) && MALEFICS.has(planet))
    .map(([planet, house]) => `${planet} in ${house}`);

  if (healthMalefics.length) {
    healthScore += 1.2;
    healthNotes.push(`Dusthana malefics detected: ${healthMalefics.join(', ')}.`);
  }

  events.push(
    buildLifeEventDetail(
      'health',
      `${healthNotes.join(' ')}
Key Sutras: ${healthRules.map(rule => rule.id).join(', ') || 'N/A'}.`,
      healthScore,
      buildAgeRange(22, 26, 0),
      healthRules
    )
  );

  const transitionRules = selectRules(rules, 'transition');
  let transitionScore = 1.1;
  const transitionNotes: string[] = ['Major transitions align with 8th/12th house triggers.'];
  const transitionIndicators = Object.entries(planetHouses)
    .filter(([planet, house]) => house && (house === 8 || house === 12) && MALEFICS.has(planet))
    .map(([planet, house]) => `${planet} in ${house}`);

  if (transitionIndicators.length) {
    transitionScore += 1.3;
    transitionNotes.push(`Intense transformation markers: ${transitionIndicators.join(', ')}.`);
  }

  events.push(
    buildLifeEventDetail(
      'transition',
      `${transitionNotes.join(' ')}
Key Sutras: ${transitionRules.map(rule => rule.id).join(', ') || 'N/A'}.`,
      transitionScore,
      buildAgeRange(27, 31, 0),
      transitionRules
    )
  );

  const successRules = selectRules(rules, 'success');
  let successScore = 1.3;
  const successNotes: string[] = ['Success periods peak when Jupiter/Mars support career houses.'];
  if (planetHouses.Jupiter === 10 || planetHouses.Mars === 10 || planetHouses.Jupiter === 11) {
    successScore += 1.2;
    successNotes.push('Jupiter/Mars strong in 10th/11th intensifies recognition.');
  }

  events.push(
    buildLifeEventDetail(
      'success',
      `${successNotes.join(' ')}
Key Sutras: ${successRules.map(rule => rule.id).join(', ') || 'N/A'}.`,
      successScore,
      buildAgeRange(32, 38, 0),
      successRules
    )
  );

  const riskRules = selectRules(rules, 'risk');
  let riskScore = 0.9;
  const riskNotes: string[] = ['Risk periods emerge with Saturn pressure or nodal afflictions.'];
  if (planetHouses.Saturn && DUSTHANA_HOUSES.has(planetHouses.Saturn)) {
    riskScore += 1.1;
    riskNotes.push('Saturn in a dusthana warns of endurance tests.');
  }
  if (planetHouses.Rahu === 8 || planetHouses.Ketu === 12) {
    riskScore += 0.8;
    riskNotes.push('Rahu/Ketu axis activates karmic turbulence.');
  }

  events.push(
    buildLifeEventDetail(
      'risk',
      `${riskNotes.join(' ')}
Key Sutras: ${riskRules.map(rule => rule.id).join(', ') || 'N/A'}.`,
      riskScore,
      buildAgeRange(40, 44, 0),
      riskRules
    )
  );

  const spiritualRules = selectRules(rules, 'spiritual');
  let spiritualScore = 1;
  const spiritualNotes: string[] = ['Spiritual pivot aligns with 9th/12th house activations.'];
  if (planetHouses.Ketu === 12 || planetHouses.Jupiter === 9) {
    spiritualScore += 1.4;
    spiritualNotes.push('Ketu/Jupiter in moksha houses signals devotion cycles.');
  }

  events.push(
    buildLifeEventDetail(
      'spiritual',
      `${spiritualNotes.join(' ')}
Key Sutras: ${spiritualRules.map(rule => rule.id).join(', ') || 'N/A'}.`,
      spiritualScore,
      buildAgeRange(34, 39, 0),
      spiritualRules
    )
  );

  const childrenRules = selectRules(rules, 'children');
  let childrenScore = 1;
  const childrenNotes: string[] = ['Children/progeny indicators track 5th house and Jupiter support.'];
  if (planetHouses.Jupiter === 5) {
    childrenScore += 1.1;
    childrenNotes.push('Jupiter in the 5th sustains progeny blessings.');
  }

  events.push(
    buildLifeEventDetail(
      'children',
      `${childrenNotes.join(' ')}
Key Sutras: ${childrenRules.map(rule => rule.id).join(', ') || 'N/A'}.`,
      childrenScore,
      buildAgeRange(26, 32, 0),
      childrenRules
    )
  );

  return events;
};

const runPrecisionCheck = (chart: ChartData, events: LifeEventDetail[], rules: LifeEventRule[]): PrecisionCheckResult => {
  const confirmations: string[] = [];
  const issues: string[] = [];
  const panchangMatches: string[] = [];
  const nakshatra = normalize(chart.nakshatra);
  if (chart.nakshatra) {
    const matches = rules.filter(rule => normalize(rule.panchang?.nakshatra) === nakshatra);
    if (matches.length) {
      panchangMatches.push(`Nakshatra alignment: ${chart.nakshatra} matches ${matches.length} Bhrigu sutras.`);
    } else {
      issues.push('No panchang nakshatra matches found in local corpus; consider online refinement.');
    }
  } else {
    issues.push('Birth nakshatra missing; panchang validation skipped.');
  }

  const adjustedEvents = events.map(event => {
    let adjusted = event;
    if (event.category === 'marriage') {
      const saturnInSeventh = event.description.includes('Saturn/Rahu/Ketu influence');
      if (saturnInSeventh && event.confidenceScore >= 2) {
        adjusted = { ...event, probability: 'Moderate', confidenceScore: event.confidenceScore - 0.5 };
        issues.push('Marriage timing shows Saturn/Rahu/Ketu delay signature; lowered probability for precision.');
      } else {
        confirmations.push('Marriage timing aligns with 7th house indicators.');
      }
    }
    if (event.category === 'career' && event.confidenceScore >= 2) {
      confirmations.push('Career peak validated by 10th house leadership indicators.');
    }
    if (event.category === 'risk' && event.confidenceScore < 1) {
      confirmations.push('Risk window moderate; no severe dusthana overload detected.');
    }
    return adjusted;
  });

  if (!confirmations.length) {
    confirmations.push('Baseline Jyotisa checks passed; no critical conflicts detected.');
  }

  return { confirmed: confirmations, issues, adjustedEvents, panchangMatches };
};

const buildTimelineContent = (events: LifeEventDetail[]): string =>
  events
    .map(
      event =>
        `- **${event.period.toUpperCase()}** (${event.ageRange}) — ${event.description}\n  Timing: ${event.timing}\n  Probability: ${event.probability}`
    )
    .join('\n');

const buildPrecisionContent = (precision: PrecisionCheckResult): string => {
  const confirmations = precision.confirmed.map(item => `• ${item}`).join('\n');
  const issues = precision.issues.length ? precision.issues.map(item => `• ${item}`).join('\n') : '• None';
  const panchang = precision.panchangMatches.length
    ? precision.panchangMatches.map(item => `• ${item}`).join('\n')
    : '• Panchang alignment not available.';

  return `✅ Confirmations:\n${confirmations}\n\n⚠️ Flags:\n${issues}\n\n🌙 Panchang Cross-check:\n${panchang}`;
};

const buildSubcategories = (events: LifeEventDetail[], precision: PrecisionCheckResult, corpus: LifeEventsCorpus): Record<string, Subcategory> => ({
  timeline: {
    title: 'Life Events Timeline (Phase 1: Generation)',
    content: buildTimelineContent(events),
    data: { events },
  },
  precision_check: {
    title: 'Precision Check (Phase 2: Validation)',
    content: buildPrecisionContent(precision),
    data: precision,
  },
  sources: {
    title: 'Bhrigu Samhita & Nadi Jyotisa Sources',
    content: `Rule coverage summary:\n${corpus.summaries.map(summary => `• ${summary}`).join('\n')}\n\nSources:\n${corpus.sources
      .map(source => `• ${source}`)
      .join('\n')}`,
    data: { sources: corpus.sources },
  },
});

const buildMetadata = (chart: ChartData, aiEnhanced: boolean): PredictionMetadata => ({
  engine: 'life_events',
  zodiac_sign: chart.zodiac_sign ?? 'Unknown',
  moon_sign: chart.moon_sign ?? chart.zodiac_sign ?? 'Unknown',
  ascendant: chart.ascendant ?? 'Unknown',
  nakshatra: chart.nakshatra ?? 'Unknown',
  ai_enhanced: aiEnhanced,
  tradition: 'Bhrigu Samhita & Nadi Jyotisa',
  calculation_method: 'Two-phase life events synthesis with panchang validation',
});

const composeAISection = async (
  chart: ChartData,
  logger: LifeEventsLogger,
  language: string,
  aiMode: string
): Promise<string | undefined> => {
  try {
    const response = await fetch('/api/ai/compose', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-AI-Consent': 'granted',
        'X-AI-Mode': aiMode,
      },
      body: JSON.stringify({
        report_section: 'life_events',
        birth_data: {
          zodiac_sign: chart.zodiac_sign,
          moon_sign: chart.moon_sign,
          ascendant: chart.ascendant,
          nakshatra: chart.nakshatra,
          planetary_positions: chart.planets,
          houses: chart.houses,
        },
        language,
      }),
    });

    if (!response.ok) {
      throw new Error(`AI compose failed: ${response.statusText}`);
    }

    const aiResponse = await response.json();
    const refined = aiResponse?.data?.refined_section as string | undefined;
    return isSectionContentValid(refined) ? refined : undefined;
  } catch (error) {
    logger.warn('AI synthesis failed', error);
    return undefined;
  }
};

export const generateLifeEventsPrediction = async (
  chart: ChartData,
  options: LifeEventsOptions = {}
): Promise<PredictionResult> => {
  const mode = options.mode ?? 'offline';
  const useAI = options.useAI ?? false;
  const cacheTtl = options.cacheTtlMs ?? DEFAULT_CACHE_TTL;
  const logger = options.logger ?? DEFAULT_LOGGER;
  const aiMode = options.aiMode ?? getAIMode();
  const cacheKey = buildCacheKey(chart, mode, useAI);

  const cached = RESULT_CACHE.get(cacheKey);
  if (isCacheValid(cached)) {
    return cached!.data;
  }

  const corpus = await loadLifeEventCorpus(mode, logger);
  const events = buildEventTimeline(chart, corpus.rules);
  const precision = runPrecisionCheck(chart, events, corpus.rules);

  let aiSynthesis: string | undefined;
  const allowAI = useAI && aiMode.consent && (mode === 'online' || mode === 'hybrid');

  if (allowAI) {
    aiSynthesis = await composeAISection(chart, logger, options.language ?? 'en', aiMode.mode);
  }

  const result: PredictionResult = {
    engine: 'life_events',
    title: 'Life Events Timeline',
    success: true,
    subcategories: buildSubcategories(precision.adjustedEvents, precision, corpus),
    ai_synthesis: aiSynthesis,
    metadata: buildMetadata(chart, !!aiSynthesis),
    generated_at: new Date().toISOString(),
    mode,
  };

  RESULT_CACHE.set(cacheKey, { data: result, expiresAt: Date.now() + cacheTtl });
  return result;
};

export const sampleLifeEventsChart: ChartData = {
  date_of_birth: '1992-05-17',
  time_of_birth: '10:30',
  place_of_birth: 'Pune, India',
  latitude: 18.5204,
  longitude: 73.8567,
  zodiac_sign: 'Taurus',
  moon_sign: 'Cancer',
  ascendant: 'Virgo',
  nakshatra: 'Pushya',
  planets: {
    Sun: { sign: 'Taurus', longitude: 54 },
    Moon: { sign: 'Cancer', longitude: 98 },
    Mars: { sign: 'Leo', longitude: 128 },
    Mercury: { sign: 'Gemini', longitude: 70 },
    Jupiter: { sign: 'Capricorn', longitude: 284 },
    Venus: { sign: 'Aries', longitude: 12 },
    Saturn: { sign: 'Aquarius', longitude: 320 },
    Rahu: { sign: 'Sagittarius', longitude: 240 },
    Ketu: { sign: 'Gemini', longitude: 60 },
  },
  houses: ['Virgo', 'Libra', 'Scorpio', 'Sagittarius', 'Capricorn', 'Aquarius', 'Pisces', 'Aries', 'Taurus', 'Gemini', 'Cancer', 'Leo'],
};

export const generateLifeEventsSample = (): Promise<PredictionResult> =>
  generateLifeEventsPrediction(sampleLifeEventsChart, { mode: 'offline' });

export type { LifeEventsMode };
