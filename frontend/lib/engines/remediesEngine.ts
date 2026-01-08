/**
 * Remedies Prediction Engine
 * Two-phase generation + precision validation for karmic remedies
 */

import type {
  ChartData,
  PredictionResult,
  Mantra,
  Gemstone,
} from '@/lib/api/predictions';
import { getAIMode } from '@/lib/ai-preferences';

export type RemediesMode = 'offline' | 'online';

export interface RemediesOptions {
  useAI?: boolean;
  language?: 'en' | 'hi' | 'sa';
  mode?: RemediesMode;
}

interface BhriguMantraCorpus {
  category: string;
  mantras: Array<{
    id: string;
    name: Record<string, string>;
    mantra: string;
    deity: string;
    purpose: Record<string, string>;
    repetitions: number | string;
    best_time: string;
    benefits: Record<string, string>;
  }>;
  metadata?: Record<string, unknown>;
}

interface BhriguGemstoneCorpus {
  category: string;
  gemstones: Array<{
    id: string;
    name: Record<string, string>;
    planet: string;
    purpose: Record<string, string>;
    weight: string;
    metal: string;
    finger: string;
    day_to_wear: string;
    benefits: Record<string, string>;
    precautions?: string;
  }>;
  general_guidelines?: Record<string, string>;
  metadata?: Record<string, unknown>;
}

interface NadiNakshatraRule {
  name: string;
  number: number;
  ruling_planet: string;
  deity: string;
  symbol: string;
  translations?: {
    en?: {
      characteristics?: string;
      soul_purpose?: string;
      remedies?: {
        mantra?: string;
        gemstone?: string;
        fasting_day?: string;
        color?: string;
      };
    };
  };
}

interface NadiNakshatraCorpus {
  category: string;
  tradition: string;
  nakshatras: NadiNakshatraRule[];
}

interface ChartAnalysis {
  afflictedPlanets: string[];
  debilitatedPlanets: string[];
  dusthanaPlanets: string[];
  zodiacSign?: string;
  nakshatra?: string;
  ascendant?: string;
  moonSign?: string;
  notes: string[];
}

interface RemedyBundle {
  mantras: Mantra[];
  gemstones: Gemstone[];
  fasting: string[];
  deityWorship: string[];
  lifestyle: string[];
  meditation: string[];
  planetaryRituals: string[];
  charity: string[];
  yantras: string[];
  pilgrimage: string[];
  karmicCleansing: string[];
  service: string[];
  sources: string[];
}

interface CacheEntry<T> {
  timestamp: number;
  data: T;
}

const CACHE_TTL = 10 * 60 * 1000;
const corpusCache = new Map<string, CacheEntry<unknown>>();
const resultCache = new Map<string, CacheEntry<PredictionResult>>();

const PLANET_DEBILITATION: Record<string, string> = {
  Sun: 'Libra',
  Moon: 'Scorpio',
  Mars: 'Cancer',
  Mercury: 'Pisces',
  Jupiter: 'Capricorn',
  Venus: 'Virgo',
  Saturn: 'Aries',
  Rahu: 'Scorpio',
  Ketu: 'Taurus',
};

const DUSTHANA_HOUSES = new Set([6, 8, 12]);

const PLANET_MANTRA_HINTS: Record<string, string[]> = {
  Sun: ['sun', 'surya'],
  Moon: ['moon', 'chandra'],
  Mars: ['mangal', 'mars'],
  Mercury: ['budha', 'mercury'],
  Jupiter: ['guru', 'jupiter'],
  Venus: ['shukra', 'venus'],
  Saturn: ['shani', 'saturn'],
  Rahu: ['rahu'],
  Ketu: ['ketu'],
};

function getCache<T>(key: string, cache: Map<string, CacheEntry<T>>): T | null {
  const entry = cache.get(key);
  if (!entry) {
    return null;
  }
  if (Date.now() - entry.timestamp > CACHE_TTL) {
    cache.delete(key);
    return null;
  }
  return entry.data;
}

function setCache<T>(key: string, data: T, cache: Map<string, CacheEntry<T>>) {
  cache.set(key, { timestamp: Date.now(), data });
}

async function fetchJson<T>(path: string): Promise<T | null> {
  try {
    const response = await fetch(path);
    if (!response.ok) {
      return null;
    }
    return (await response.json()) as T;
  } catch (error) {
    console.error(`[RemediesEngine] Failed to fetch ${path}:`, error);
    return null;
  }
}

async function loadBhriguMantras(): Promise<BhriguMantraCorpus | null> {
  const cacheKey = 'bhrigu-mantras';
  const cached = getCache<BhriguMantraCorpus>(cacheKey, corpusCache as Map<string, CacheEntry<BhriguMantraCorpus>>);
  if (cached) {
    return cached;
  }
  const data = await fetchJson<BhriguMantraCorpus>('/data/bhrigu_mantras.json');
  if (data) {
    setCache(cacheKey, data, corpusCache as Map<string, CacheEntry<BhriguMantraCorpus>>);
  }
  return data;
}

async function loadBhriguGemstones(): Promise<BhriguGemstoneCorpus | null> {
  const cacheKey = 'bhrigu-gemstones';
  const cached = getCache<BhriguGemstoneCorpus>(cacheKey, corpusCache as Map<string, CacheEntry<BhriguGemstoneCorpus>>);
  if (cached) {
    return cached;
  }
  const data = await fetchJson<BhriguGemstoneCorpus>('/data/bhrigu_gemstones.json');
  if (data) {
    setCache(cacheKey, data, corpusCache as Map<string, CacheEntry<BhriguGemstoneCorpus>>);
  }
  return data;
}

async function loadNadiNakshatraRules(): Promise<NadiNakshatraCorpus | null> {
  const cacheKey = 'nadi-nakshatra';
  const cached = getCache<NadiNakshatraCorpus>(cacheKey, corpusCache as Map<string, CacheEntry<NadiNakshatraCorpus>>);
  if (cached) {
    return cached;
  }
  let data = await fetchJson<NadiNakshatraCorpus>('/data/nadi_nakshatra_rules.json');
  if (!data) {
    data = await fetchJson<NadiNakshatraCorpus>(
      'https://raw.githubusercontent.com/hisr2024/BhriguWelt/main/core_wisdom/nadi_jyotisa/rules/nakshatra_rules.json'
    );
  }
  if (data) {
    setCache(cacheKey, data, corpusCache as Map<string, CacheEntry<NadiNakshatraCorpus>>);
  }
  return data;
}

function normalizePlanetName(name: string): string {
  return name
    .replace(/\s+/g, ' ')
    .replace(/\b(Shani|Surya|Chandra|Mangal|Budha|Guru|Shukra)\b/gi, (match) => match)
    .trim();
}

function analyzeChart(chartData: ChartData): ChartAnalysis {
  const afflictedPlanets = new Set<string>();
  const debilitatedPlanets = new Set<string>();
  const dusthanaPlanets = new Set<string>();
  const notes: string[] = [];

  if (!chartData.planets || Object.keys(chartData.planets).length === 0) {
    notes.push('Planetary positions missing; remedies are limited to nakshatra guidance.');
  }

  const houses = chartData.houses ?? [];
  const houseIndexBySign = new Map<string, number>();
  if (houses.length === 12) {
    houses.forEach((sign, index) => {
      houseIndexBySign.set(sign, index + 1);
    });
  }

  Object.entries(chartData.planets ?? {}).forEach(([planetName, position]) => {
    const planet = normalizePlanetName(planetName);
    const planetSign = position?.sign;
    if (planetSign && PLANET_DEBILITATION[planet] === planetSign) {
      debilitatedPlanets.add(planet);
      afflictedPlanets.add(planet);
    }
    if (planetSign && houseIndexBySign.has(planetSign)) {
      const houseNumber = houseIndexBySign.get(planetSign);
      if (houseNumber && DUSTHANA_HOUSES.has(houseNumber)) {
        dusthanaPlanets.add(planet);
        afflictedPlanets.add(planet);
      }
    }
  });

  if (afflictedPlanets.size === 0 && chartData.nakshatra) {
    notes.push('No explicit planetary afflictions detected; remedies derived from nakshatra stewardship.');
  }

  return {
    afflictedPlanets: Array.from(afflictedPlanets),
    debilitatedPlanets: Array.from(debilitatedPlanets),
    dusthanaPlanets: Array.from(dusthanaPlanets),
    zodiacSign: chartData.zodiac_sign,
    nakshatra: chartData.nakshatra,
    ascendant: chartData.ascendant,
    moonSign: chartData.moon_sign,
    notes,
  };
}

function findMantrasForPlanets(mantras: BhriguMantraCorpus | null, planets: string[], language: 'en' | 'hi' | 'sa'): Mantra[] {
  if (!mantras?.mantras?.length) {
    return [];
  }
  const selected: Mantra[] = [];
  planets.forEach((planet) => {
    const hints = PLANET_MANTRA_HINTS[planet] ?? [planet.toLowerCase()];
    const match = mantras.mantras.find((entry) => {
      const deity = entry.deity?.toLowerCase();
      const name = entry.name?.en?.toLowerCase();
      return hints.some((hint) => deity?.includes(hint) || name?.includes(hint));
    });
    if (match) {
      selected.push({
        planet,
        mantra: match.mantra,
        count: String(match.repetitions ?? 108),
        timing: match.best_time,
        benefits: match.benefits?.[language] || match.benefits?.en || '',
      });
    }
  });
  return selected;
}

function findGemstonesForPlanets(gemstones: BhriguGemstoneCorpus | null, planets: string[], language: 'en' | 'hi' | 'sa'): Gemstone[] {
  if (!gemstones?.gemstones?.length) {
    return [];
  }
  return gemstones.gemstones
    .filter((entry) => planets.includes(entry.planet))
    .map((entry) => ({
      ascendant: entry.planet,
      primary_stone: entry.name?.[language] || entry.name?.en || entry.id,
      weight: entry.weight,
      metal: entry.metal,
      finger: entry.finger,
      day_to_wear: entry.day_to_wear,
      energizing: entry.precautions || entry.benefits?.[language] || entry.benefits?.en || '',
    }));
}

function getNakshatraRule(rules: NadiNakshatraCorpus | null, nakshatra?: string): NadiNakshatraRule | null {
  if (!rules?.nakshatras || !nakshatra) {
    return null;
  }
  const normalized = nakshatra.toLowerCase();
  return rules.nakshatras.find((entry) => entry.name.toLowerCase() === normalized) ?? null;
}

function buildOfflineBundle(
  analysis: ChartAnalysis,
  mantras: BhriguMantraCorpus | null,
  gemstones: BhriguGemstoneCorpus | null,
  nadiRules: NadiNakshatraCorpus | null,
  language: 'en' | 'hi' | 'sa'
): RemedyBundle {
  const nakshatraRule = getNakshatraRule(nadiRules, analysis.nakshatra);
  const targetPlanets = analysis.afflictedPlanets.length > 0
    ? analysis.afflictedPlanets
    : nakshatraRule?.ruling_planet
      ? [nakshatraRule.ruling_planet]
      : [];

  const remedyBundle: RemedyBundle = {
    mantras: findMantrasForPlanets(mantras, targetPlanets, language),
    gemstones: findGemstonesForPlanets(gemstones, targetPlanets, language),
    fasting: [],
    deityWorship: [],
    lifestyle: [],
    meditation: [],
    planetaryRituals: [],
    charity: [],
    yantras: [],
    pilgrimage: [],
    karmicCleansing: [],
    service: [],
    sources: [],
  };

  if (nakshatraRule?.translations?.en?.remedies) {
    const remedies = nakshatraRule.translations.en.remedies;
    if (remedies.mantra) {
      remedyBundle.mantras.push({
        planet: nakshatraRule.ruling_planet,
        mantra: remedies.mantra,
        count: '108',
        timing: 'Dawn or nakshatra hour',
        benefits: 'Align with nakshatra deity and karmic path',
      });
    }
    if (remedies.gemstone) {
      remedyBundle.gemstones.push({
        ascendant: nakshatraRule.ruling_planet,
        primary_stone: remedies.gemstone,
        weight: 'As prescribed by chart',
        metal: 'Traditionally aligned metal',
        finger: 'As per ruling planet guidance',
        day_to_wear: remedies.fasting_day || 'Nakshatra day',
        energizing: `Invoke ${nakshatraRule.deity} before wearing.`,
      });
    }
    if (remedies.fasting_day) {
      remedyBundle.fasting.push(
        `${remedies.fasting_day}: observe a sattvic fast honoring ${nakshatraRule.deity}.`
      );
    }
    if (nakshatraRule.deity) {
      remedyBundle.deityWorship.push(
        `Worship ${nakshatraRule.deity} with offerings aligned to ${nakshatraRule.name}.`
      );
    }
    if (remedies.color) {
      remedyBundle.lifestyle.push(
        `Incorporate ${remedies.color} in prayer attire or altar decor to harmonize ${nakshatraRule.name}.`
      );
    }
  }

  if (analysis.debilitatedPlanets.length > 0) {
    remedyBundle.planetaryRituals.push(
      `Perform Graha Shanti for debilitated planets: ${analysis.debilitatedPlanets.join(', ')}.`
    );
  }

  if (analysis.dusthanaPlanets.length > 0) {
    remedyBundle.karmicCleansing.push(
      `Schedule weekly seva aligned with ${analysis.dusthanaPlanets.join(', ')} to neutralize 6th/8th/12th house strain.`
    );
  }

  remedyBundle.sources.push('Bhrigu Samhita remedies corpus', 'Nadi Jyotisa nakshatra remedies');

  return remedyBundle;
}

function dedupeMantras(mantras: Mantra[]): Mantra[] {
  const seen = new Set<string>();
  return mantras.filter((mantra) => {
    const key = `${mantra.planet}-${mantra.mantra}`;
    if (seen.has(key)) {
      return false;
    }
    seen.add(key);
    return true;
  });
}

function dedupeGemstones(gemstones: Gemstone[]): Gemstone[] {
  const seen = new Set<string>();
  return gemstones.filter((gemstone) => {
    const key = `${gemstone.ascendant}-${gemstone.primary_stone}`;
    if (seen.has(key)) {
      return false;
    }
    seen.add(key);
    return true;
  });
}

function precisionCheck(bundle: RemedyBundle, analysis: ChartAnalysis): RemedyBundle {
  const targetPlanets = new Set(
    analysis.afflictedPlanets.length > 0
      ? analysis.afflictedPlanets
      : analysis.nakshatra
        ? [analysis.nakshatra]
        : []
  );

  const filteredMantras = dedupeMantras(
    bundle.mantras.filter((entry) => !analysis.afflictedPlanets.length || targetPlanets.has(entry.planet))
  );
  const filteredGemstones = dedupeGemstones(
    bundle.gemstones.filter((entry) => !analysis.afflictedPlanets.length || targetPlanets.has(entry.ascendant))
  );

  return {
    ...bundle,
    mantras: filteredMantras,
    gemstones: filteredGemstones,
  };
}

function formatMantras(mantras: Mantra[]): string {
  if (mantras.length === 0) {
    return 'No mantra is prescribed from the classical corpus for the current chart inputs.';
  }
  return mantras
    .map(
      (mantra) =>
        `- **${mantra.planet}**: ${mantra.mantra} (${mantra.count} repetitions, ${mantra.timing}). ${mantra.benefits}`
    )
    .join('\n');
}

function formatGemstones(gemstones: Gemstone[]): string {
  if (gemstones.length === 0) {
    return 'No gemstone recommendation is made without precise planetary affliction confirmation.';
  }
  return gemstones
    .map(
      (gemstone) =>
        `- **${gemstone.primary_stone}** (${gemstone.ascendant}): ${gemstone.weight}, ${gemstone.metal}, ${gemstone.finger}. Wear on ${gemstone.day_to_wear}. ${gemstone.energizing}`
    )
    .join('\n');
}

function formatList(items: string[], emptyMessage: string): string {
  if (!items.length) {
    return emptyMessage;
  }
  return items.map((item) => `- ${item}`).join('\n');
}

async function fetchAISuggestions(chartData: ChartData): Promise<string | null> {
  if (typeof window === 'undefined') {
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
        report_section: 'karmic_remedies',
        birth_data: {
          zodiac_sign: chartData.zodiac_sign,
          moon_sign: chartData.moon_sign,
          ascendant: chartData.ascendant,
          nakshatra: chartData.nakshatra,
          planetary_positions: chartData.planets,
          houses: chartData.houses,
        },
      }),
    });

    if (!response.ok) {
      return null;
    }

    const payload = await response.json();
    return payload?.data?.refined_section ?? null;
  } catch (error) {
    console.error('[RemediesEngine] AI suggestion failed:', error);
    return null;
  }
}

function buildPredictionResult(
  bundle: RemedyBundle,
  analysis: ChartAnalysis,
  aiSynthesis: string | null,
  mode: RemediesMode
): PredictionResult {
  return {
    engine: 'karmic_remedies',
    title: 'Your Personalized Karmic Remedies',
    success: true,
    subcategories: {
      mantras: {
        title: 'Mantras & Chanting',
        content: formatMantras(bundle.mantras),
        data: bundle.mantras,
      },
      gemstones: {
        title: 'Gemstones & Crystals',
        content: formatGemstones(bundle.gemstones),
        data: bundle.gemstones,
      },
      yantras: {
        title: 'Yantras & Sacred Geometry',
        content: formatList(
          bundle.yantras,
          'No yantra is prescribed without a specific planetary affliction or yantra reference.'
        ),
      },
      charitable_activities: {
        title: 'Charitable Activities',
        content: formatList(
          bundle.charity,
          'Charitable remedies are withheld until precise afflictions or doshas are confirmed.'
        ),
      },
      fasting: {
        title: 'Fasting & Dietary Practices',
        content: formatList(
          bundle.fasting,
          'No fasting guidance is prescribed beyond nakshatra-specific observances.'
        ),
      },
      deity_worship: {
        title: 'Deity Worship',
        content: formatList(
          bundle.deityWorship,
          'Deity worship guidance requires a defined nakshatra or planet focus.'
        ),
      },
      pilgrimage: {
        title: 'Pilgrimage & Sacred Sites',
        content: formatList(
          bundle.pilgrimage,
          'Pilgrimage guidance is not provided without clear karmic indicators.'
        ),
      },
      lifestyle: {
        title: 'Lifestyle Modifications',
        content: formatList(
          bundle.lifestyle,
          'Lifestyle adjustments are limited to nakshatra-aligned practices when indicated.'
        ),
      },
      planetary_rituals: {
        title: 'Planetary Rituals',
        content: formatList(
          bundle.planetaryRituals,
          'Planetary rituals require confirmed debilitations or dusthana placements.'
        ),
      },
      karmic_cleansing: {
        title: 'Karmic Cleansing Practices',
        content: formatList(
          bundle.karmicCleansing,
          'Karmic cleansing is advised only when dusthana stress is verified.'
        ),
      },
      service: {
        title: 'Service & Seva',
        content: formatList(
          bundle.service,
          'Service prescriptions are withheld until a specific karmic deficit is confirmed.'
        ),
      },
      meditation: {
        title: 'Meditation & Yoga',
        content: formatList(
          bundle.meditation,
          'Meditation guidance is limited to chart-specific afflictions and nakshatra cues.'
        ),
      },
    },
    ai_synthesis: aiSynthesis ?? undefined,
    metadata: {
      engine: 'karmic_remedies',
      zodiac_sign: chartDataFallback(analysis, 'zodiac_sign'),
      moon_sign: chartDataFallback(analysis, 'moon_sign'),
      ascendant: chartDataFallback(analysis, 'ascendant'),
      nakshatra: chartDataFallback(analysis, 'nakshatra'),
      ai_enhanced: Boolean(aiSynthesis),
      tradition: 'Bhrigu Samhita & Nadi Jyotisa',
      calculation_method: mode === 'online' ? 'AI + Classical corpus' : 'Classical corpus',
    },
    generated_at: new Date().toISOString(),
    mode,
  };
}

function chartDataFallback(
  analysis: ChartAnalysis,
  field: 'zodiac_sign' | 'moon_sign' | 'ascendant' | 'nakshatra'
): string {
  switch (field) {
    case 'zodiac_sign':
      return analysis.zodiacSign ?? 'Unknown';
    case 'ascendant':
      return analysis.ascendant ?? 'Unknown';
    case 'moon_sign':
      return analysis.moonSign ?? 'Unknown';
    case 'nakshatra':
      return analysis.nakshatra ?? 'Unknown';
    default:
      return 'Unknown';
  }
}

export async function generateRemediesPrediction(
  chartData: ChartData,
  options: RemediesOptions = {}
): Promise<PredictionResult> {
  const { useAI = true, language = 'en', mode = useAI ? 'online' : 'offline' } = options;
  const cacheKey = JSON.stringify({
    planets: chartData.planets,
    houses: chartData.houses,
    nakshatra: chartData.nakshatra,
    ascendant: chartData.ascendant,
    moon_sign: chartData.moon_sign,
    useAI,
    language,
  });

  const cached = getCache(cacheKey, resultCache);
  if (cached) {
    return cached;
  }

  const analysis = analyzeChart(chartData);
  const [bhriguMantras, bhriguGemstones, nadiRules] = await Promise.all([
    loadBhriguMantras(),
    loadBhriguGemstones(),
    loadNadiNakshatraRules(),
  ]);

  let remedyBundle = buildOfflineBundle(
    analysis,
    bhriguMantras,
    bhriguGemstones,
    nadiRules,
    language
  );

  remedyBundle = precisionCheck(remedyBundle, analysis);

  const aiSynthesis = useAI ? await fetchAISuggestions(chartData) : null;

  const result = buildPredictionResult(remedyBundle, analysis, aiSynthesis, mode);
  setCache(cacheKey, result, resultCache);

  return result;
}
