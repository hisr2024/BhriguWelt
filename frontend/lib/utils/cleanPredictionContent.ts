/**
 * Advanced Content Cleaning and Formatting Utility
 * Removes repetitive introductions and formats prediction content
 */

import type {
  RawPrediction,
  ParsedPrediction,
  PredictionSection,
  ContentCleaningOptions
} from '@/lib/types/predictions';

// ============================================================================
// REMOVAL PATTERNS
// ============================================================================

/**
 * Patterns to remove from prediction content
 * These are repetitive introductions that don't add value
 */
const REMOVAL_PATTERNS = {
  // Bhrigu Samhita introductions
  bhriguIntros: [
    /The Bhrigu Samhita principles reveal the karmic blueprint based on planetary positions[^.]*\./gi,
    /Bhrigu Samhita Insights?:?\s*/gi,
    /The Bhrigu Samhita[^.]*emphasizing Jupiter's influence[^.]*\./gi,
    /The Bhrigu Samhita[^.]*emphasizing[^.]*planetary positions[^.]*\./gi,
    /Based on Bhrigu Samhita principles[^.]*,?\s*/gi,
  ],

  // Nadi Jyotisha introductions
  nadiIntros: [
    /Nadi Jyotisha Revelations?:?\s*/gi,
    /Nadi Jyotisha techniques offer precise life predictions through thumb impression[^.]*\./gi,
    /Nadi Jyotisha[^.]*Dasha systems[^.]*\./gi,
    /Through Nadi Jyotisha methods[^.]*,?\s*/gi,
  ],

  // Generic astrology introductions
  genericIntros: [
    /Insightful Vedic astrological predictions based on[^.]*\./gi,
    /The analysis will focus on identifying specific yogas[^.]*\./gi,
    /This prediction is based on ancient Vedic principles[^.]*\./gi,
  ],

  // Section headers (when they appear in content)
  sectionHeaders: [
    /Planetary Combinations Analysis:?\s*/gi,
    /Doshas and Remedies:?\s*/gi,
    /Timing of Events:?\s*/gi,
    /Karmic Patterns:?\s*/gi,
  ],

  // Technical metadata
  metadata: [
    /"confidence":\s*[\d.]+,?\s*/gi,
    /"summary":\s*"[^"]*",?\s*/gi,
    /"sections":\s*\{[^}]*\},?\s*/gi,
  ],

  // Excessive quotes and formatting
  formatting: [
    /^["'\s]+|["'\s]+$/g,          // Leading/trailing quotes
    /\s+/g,                         // Multiple spaces
    /\n\s*\n\s*\n+/g,              // Multiple newlines
    /\s+([.,!?;:])/g,              // Space before punctuation
  ],
};

// ============================================================================
// CONTENT CLEANING FUNCTION
// ============================================================================

/**
 * Clean prediction content by removing repetitive patterns
 */
export function cleanPredictionContent(
  content: string,
  options: ContentCleaningOptions = {}
): string {
  if (!content || typeof content !== 'string') return '';

  let cleaned = content;

  // Apply removal patterns
  if (options.removeIntroductions !== false) {
    Object.values(REMOVAL_PATTERNS).flat().forEach(pattern => {
      cleaned = cleaned.replace(pattern, '');
    });
  }

  // Apply formatting fixes
  cleaned = cleaned
    .replace(/\s+/g, ' ')                    // Multiple spaces to single
    .replace(/\n\s*\n\s*\n+/g, '\n\n')      // Multiple newlines to double
    .replace(/^["'\s]+|["'\s]+$/g, '')      // Trim quotes
    .replace(/\s+([.,!?;:])/g, '$1')        // Fix punctuation
    .trim();

  // Simplify language if requested
  if (options.simplifyLanguage) {
    cleaned = simplifyLanguage(cleaned);
  }

  // Truncate if max length specified
  if (options.maxLength && cleaned.length > options.maxLength) {
    cleaned = cleaned.substring(0, options.maxLength) + '...';
  }

  return cleaned;
}

/**
 * Simplify technical language for better readability
 */
function simplifyLanguage(text: string): string {
  const replacements: Record<string, string> = {
    'the native': 'you',
    'The native': 'You',
    'planetary positions': 'planet placements',
    'karmic blueprint': 'life purpose',
    'Mahadasha': 'major life period',
    'Antardasha': 'sub-period',
    'yogas': 'planetary combinations',
    'afflicted': 'challenged',
    'benefic': 'positive',
    'malefic': 'challenging',
  };

  let simplified = text;
  Object.entries(replacements).forEach(([from, to]) => {
    const regex = new RegExp(`\\b${from}\\b`, 'gi');
    simplified = simplified.replace(regex, to);
  });

  return simplified;
}

// ============================================================================
// PREDICTION PARSING FUNCTION
// ============================================================================

/**
 * Parse raw prediction data into structured format
 */
export function parsePrediction(
  rawPrediction: RawPrediction | string | null | undefined,
  category: string = 'Prediction'
): ParsedPrediction | null {
  if (!rawPrediction) return null;

  // Handle string input
  if (typeof rawPrediction === 'string') {
    try {
      const parsed = JSON.parse(rawPrediction);
      return parsePrediction(parsed, category);
    } catch {
      // Not JSON, treat as plain text
      return {
        id: generateId(),
        category,
        summary: cleanPredictionContent(rawPrediction),
        sections: [],
        confidence: 0.95,
        generatedAt: new Date().toISOString(),
      };
    }
  }

  // Extract data
  const data = rawPrediction as RawPrediction;
  const summary = cleanPredictionContent(String(data.summary || ''));
  const confidence = typeof data.confidence === 'number'
    ? Math.min(Math.max(data.confidence, 0), 1)
    : 0.95;

  // Parse sections
  const sections = parseSections(data.sections);

  return {
    id: generateId(),
    category,
    summary,
    sections,
    confidence,
    generatedAt: new Date().toISOString(),
    metadata: {
      model: String((data.metadata as Record<string, unknown> | undefined)?.model ?? 'unknown'),
      version: String((data.metadata as Record<string, unknown> | undefined)?.version ?? '1.0'),
    },
  };
}

/**
 * Parse sections from various input formats
 */
function parseSections(
  sectionsData: Record<string, string> | PredictionSection[] | undefined
): PredictionSection[] {
  if (!sectionsData) return [];

  // Already in correct format
  if (Array.isArray(sectionsData)) {
    return sectionsData.map((section, index) => ({
      id: section.id || `section-${index}`,
      title: section.title || `Section ${index + 1}`,
      content: cleanPredictionContent(section.content || ''),
      confidence: section.confidence,
      metadata: section.metadata,
    }));
  }

  // Convert object to array
  if (typeof sectionsData === 'object') {
    return Object.entries(sectionsData)
      .filter(([key, value]) => {
        // Filter out metadata keys
        return !['confidence', 'summary', 'metadata', 'id'].includes(key) && value;
      })
      .map(([key, value], index) => ({
        id: `section-${index}`,
        title: formatSectionTitle(key),
        content: cleanPredictionContent(String(value)),
      }));
  }

  return [];
}

/**
 * Format section title from key
 */
export function formatSectionTitle(key: string): string {
  return key
    // Convert camelCase to spaces
    .replace(/([A-Z])/g, ' $1')
    // Convert snake_case to spaces
    .replace(/_/g, ' ')
    // Convert kebab-case to spaces
    .replace(/-/g, ' ')
    // Capitalize each word
    .replace(/\b\w/g, c => c.toUpperCase())
    // Clean up extra spaces
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Generate unique ID
 */
function generateId(): string {
  return `pred-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

// ============================================================================
// CONTENT VALIDATION
// ============================================================================

/**
 * Validate prediction content quality
 */
export function validatePredictionContent(prediction: ParsedPrediction): {
  isValid: boolean;
  warnings: string[];
  score: number;
} {
  const warnings: string[] = [];
  let score = 100;

  // Check summary length
  if (prediction.summary.length < 50) {
    warnings.push('Summary is too short');
    score -= 20;
  }

  if (prediction.summary.length > 1000) {
    warnings.push('Summary is very long');
    score -= 10;
  }

  // Check sections
  if (prediction.sections.length === 0) {
    warnings.push('No sections found');
    score -= 30;
  }

  prediction.sections.forEach((section, index) => {
    if (section.content.length < 20) {
      warnings.push(`Section ${index + 1} is too short`);
      score -= 10;
    }

    if (!section.title) {
      warnings.push(`Section ${index + 1} has no title`);
      score -= 5;
    }
  });

  // Check for repetitive content
  const allContent = prediction.summary + ' ' +
    prediction.sections.map(s => s.content).join(' ');

  if (/Bhrigu Samhita.*Bhrigu Samhita.*Bhrigu Samhita/i.test(allContent)) {
    warnings.push('Repetitive Bhrigu Samhita references detected');
    score -= 15;
  }

  return {
    isValid: score >= 50,
    warnings,
    score: Math.max(0, score),
  };
}

// ============================================================================
// PREDICTION VIEW DATA PARSER
// ============================================================================

import type {
  PredictionViewData,
  PredictionTimeframe,
  CategoryRating,
  LuckyElements,
  DailyInsightResponse,
  WeeklyForecastResponse,
  MonthlyForecastResponse,
  YearlyForecastResponse,
} from '@/lib/types/predictions';

/**
 * Parse any prediction response into unified view data
 */
export function parsePredictionToViewData(
  response: unknown,
  timeframe: PredictionTimeframe,
  zodiacSign: string = 'Aries'
): PredictionViewData {
  if (!response) {
    return createFallbackViewData(timeframe, zodiacSign);
  }

  // If response is a string, try to extract meaningful content
  if (typeof response === 'string') {
    return parseStringResponse(response, timeframe, zodiacSign);
  }

  // Handle nested prediction object
  const data = extractPredictionData(response);

  // Determine if this is a Daily Insights API response format
  if (isDailyInsightResponse(data)) {
    return parseDailyInsightResponse(data as unknown as DailyInsightResponse, timeframe);
  }

  if (isWeeklyForecastResponse(data)) {
    return parseWeeklyForecastResponse(data as unknown as WeeklyForecastResponse);
  }

  if (isMonthlyForecastResponse(data)) {
    return parseMonthlyForecastResponse(data as unknown as MonthlyForecastResponse);
  }

  if (isYearlyForecastResponse(data)) {
    return parseYearlyForecastResponse(data as unknown as YearlyForecastResponse);
  }

  // Handle generic prediction response with sections
  return parseGenericPredictionResponse(data, timeframe, zodiacSign);
}

/**
 * Extract prediction data from nested response
 */
function extractPredictionData(response: unknown): Record<string, unknown> {
  if (!response || typeof response !== 'object') {
    return {};
  }

  const obj = response as Record<string, unknown>;

  // Check for nested prediction object
  if (obj.prediction && typeof obj.prediction === 'object') {
    return obj.prediction as Record<string, unknown>;
  }

  // Check for data wrapper
  if (obj.data && typeof obj.data === 'object') {
    const data = obj.data as Record<string, unknown>;
    if (data.prediction && typeof data.prediction === 'object') {
      return data.prediction as Record<string, unknown>;
    }
    return data;
  }

  return obj;
}

/**
 * Type guards
 */
function isDailyInsightResponse(data: unknown): boolean {
  if (!data || typeof data !== 'object') return false;
  const d = data as Record<string, unknown>;
  return 'day_ruler' in d || 'energy_level' in d || 'do_list' in d;
}

function isWeeklyForecastResponse(data: unknown): boolean {
  if (!data || typeof data !== 'object') return false;
  const d = data as Record<string, unknown>;
  return 'weekly_theme' in d && 'daily_forecasts' in d;
}

function isMonthlyForecastResponse(data: unknown): boolean {
  if (!data || typeof data !== 'object') return false;
  const d = data as Record<string, unknown>;
  return 'month_name' in d && 'monthly_mantra' in d;
}

function isYearlyForecastResponse(data: unknown): boolean {
  if (!data || typeof data !== 'object') return false;
  const d = data as Record<string, unknown>;
  return 'quarters' in d && 'annual_guidance' in d;
}

/**
 * Parse Daily Insight Response
 */
function parseDailyInsightResponse(
  data: DailyInsightResponse,
  timeframe: PredictionTimeframe
): PredictionViewData {
  const zodiacSign = data.metadata?.zodiac_sign || 'Aries';

  return {
    timeframe,
    zodiacSign,
    energy: mapEnergyLevel(data.energy_level?.level),
    energyScore: data.energy_level?.score || data.overall?.rating || 75,
    overall: data.overall?.message || 'Cosmic energies align in your favor today.',

    categories: {
      love: data.categories?.love || createDefaultCategory('Love energies are favorable today.'),
      career: data.categories?.career || createDefaultCategory('Professional opportunities arise.'),
      health: data.categories?.health || createDefaultCategory('Vitality supports your activities.'),
      finance: data.categories?.finance || createDefaultCategory('Financial stability indicated.'),
      spiritual: data.categories?.spiritual,
    },

    luckyElements: data.lucky_elements || createDefaultLuckyElements(),

    dos: data.do_list || [],
    donts: data.dont_list || [],

    dailyDetails: {
      date: data.date || new Date().toISOString().split('T')[0] || '',
      dayOfWeek: data.day_of_week || new Date().toLocaleDateString('en-US', { weekday: 'long' }),
      dayRuler: {
        planet: data.day_ruler?.planet || 'Sun',
        deity: data.day_ruler?.deity || 'Surya',
      },
      nakshatraEnergy: data.nakshatra_energy,
    },

    metadata: {
      moonSign: data.metadata?.moon_sign,
      nakshatra: data.metadata?.nakshatra,
      ascendant: data.metadata?.ascendant,
      tradition: data.metadata?.tradition || 'Bhrigu Samhita & Nadi Jyotisha',
      generatedAt: data.metadata?.generated_at || new Date().toISOString(),
    },
  };
}

/**
 * Parse Weekly Forecast Response
 */
function parseWeeklyForecastResponse(data: WeeklyForecastResponse): PredictionViewData {
  const zodiacSign = data.metadata?.zodiac_sign || 'Aries';

  // Calculate average energy from daily forecasts
  const avgEnergy = data.daily_forecasts?.length
    ? data.daily_forecasts.reduce((sum, d) => sum + (d.energy?.score || 70), 0) / data.daily_forecasts.length
    : 70;

  return {
    timeframe: 'weekly',
    zodiacSign,
    energy: avgEnergy >= 75 ? 'Positive' : avgEnergy >= 50 ? 'Neutral' : 'Challenging',
    energyScore: Math.round(avgEnergy),
    overall: data.weekly_theme || 'A balanced week ahead with opportunities for growth.',

    categories: createDefaultCategories(),
    luckyElements: createDefaultLuckyElements(),

    dos: [data.weekly_advice || 'Stay focused on your goals this week.'],
    donts: [],

    weeklyDetails: {
      weekStart: data.week_start || '',
      weekEnd: data.week_end || '',
      theme: data.weekly_theme || '',
      bestDays: data.best_days || [],
      challengingDays: data.challenging_days || [],
      dailyForecasts: (data.daily_forecasts || []).map(d => ({
        date: d.date,
        dayName: d.day_name,
        summary: d.summary,
        energyScore: d.energy?.score || 70,
      })),
    },

    metadata: {
      moonSign: data.metadata?.moon_sign,
      tradition: data.metadata?.tradition || 'Bhrigu Samhita & Nadi Jyotisha',
      generatedAt: data.metadata?.generated_at || new Date().toISOString(),
    },
  };
}

/**
 * Parse Monthly Forecast Response
 */
function parseMonthlyForecastResponse(data: MonthlyForecastResponse): PredictionViewData {
  const zodiacSign = data.metadata?.zodiac_sign || 'Aries';

  return {
    timeframe: 'monthly',
    zodiacSign,
    energy: 'Positive',
    energyScore: 75,
    overall: data.overview || 'A transformative month with significant growth opportunities.',

    categories: {
      love: data.categories?.love || createDefaultCategory('Love energies favor deep connections this month.'),
      career: data.categories?.career || createDefaultCategory('Career momentum builds steadily.'),
      health: data.categories?.health || createDefaultCategory('Health remains stable with consistent care.'),
      finance: data.categories?.finance || createDefaultCategory('Financial planning yields positive results.'),
      spiritual: data.categories?.spiritual,
    },

    luckyElements: createDefaultLuckyElements(),

    monthlyDetails: {
      monthName: data.month_name || '',
      year: data.year || new Date().getFullYear(),
      mantra: data.monthly_mantra || '',
      powerDays: data.power_days || [],
      importantDates: data.important_dates || [],
    },

    metadata: {
      moonSign: data.metadata?.moon_sign,
      nakshatra: data.metadata?.nakshatra,
      tradition: data.metadata?.tradition || 'Bhrigu Samhita & Nadi Jyotisha',
      generatedAt: data.metadata?.generated_at || new Date().toISOString(),
    },
  };
}

/**
 * Parse Yearly Forecast Response
 */
function parseYearlyForecastResponse(data: YearlyForecastResponse): PredictionViewData {
  const zodiacSign = data.metadata?.zodiac_sign || 'Aries';

  return {
    timeframe: 'yearly',
    zodiacSign,
    energy: 'Positive',
    energyScore: 80,
    overall: data.theme?.summary || 'A transformative year of growth and expansion.',

    categories: {
      love: data.categories?.love || createDefaultCategory('Relationships deepen and flourish this year.'),
      career: data.categories?.career || createDefaultCategory('Professional achievements mark this year.'),
      health: data.categories?.health || createDefaultCategory('Health improves with consistent self-care.'),
      finance: data.categories?.finance || createDefaultCategory('Financial growth through strategic planning.'),
      spiritual: data.categories?.spiritual,
    },

    luckyElements: createDefaultLuckyElements(),

    yearlyDetails: {
      year: data.year || new Date().getFullYear(),
      themeTitle: data.theme?.title || 'Year of Transformation',
      keywords: data.theme?.keywords || ['Growth', 'Opportunity', 'Balance'],
      quarters: (data.quarters || []).map(q => ({
        name: q.name,
        theme: q.theme,
        focusAreas: q.focus_areas || [],
      })),
      keyMonths: data.key_months || [],
      annualGuidance: data.annual_guidance || '',
    },

    metadata: {
      moonSign: data.metadata?.moon_sign,
      nakshatra: data.metadata?.nakshatra,
      dasha: data.metadata?.dasha,
      tradition: data.metadata?.tradition || 'Bhrigu Samhita & Nadi Jyotisha',
      generatedAt: data.metadata?.generated_at || new Date().toISOString(),
    },
  };
}

/**
 * Parse generic prediction response (handles legacy formats)
 */
function parseGenericPredictionResponse(
  data: Record<string, unknown>,
  timeframe: PredictionTimeframe,
  zodiacSign: string
): PredictionViewData {
  // Try to extract summary from various possible locations
  let overall = '';

  // Check for structured sections
  if (data.sections && typeof data.sections === 'object') {
    const sections = data.sections as Record<string, string>;
    overall = extractOverallFromSections(sections);
  }

  // Check for summary field
  if (data.summary && typeof data.summary === 'string') {
    overall = cleanPredictionContent(data.summary);
  }

  // Check for prediction text
  if (data.prediction && typeof data.prediction === 'string') {
    overall = cleanPredictionContent(data.prediction);
  }

  // Check for daily/weekly/monthly/yearly fields
  const timeframeField = data[timeframe];
  if (timeframeField && typeof timeframeField === 'string') {
    overall = cleanPredictionContent(timeframeField);
  }

  // Extract category ratings if available
  const categories = extractCategories(data);

  // Extract lucky elements
  const luckyElements = extractLuckyElements(data);

  // Extract metadata
  const metadata = extractMetadata(data, zodiacSign);

  return {
    timeframe,
    zodiacSign: metadata.zodiacSign || zodiacSign,
    energy: determineEnergy(data),
    energyScore: extractEnergyScore(data),
    overall: overall || createDefaultOverall(timeframe),

    sections: extractSections(data),
    categories,
    luckyElements,

    dos: extractList(data, ['do_list', 'dos', 'advice']),
    donts: extractList(data, ['dont_list', 'donts', 'avoid']),

    metadata: {
      moonSign: metadata.moonSign,
      nakshatra: metadata.nakshatra,
      ascendant: metadata.ascendant,
      dasha: metadata.dasha,
      tradition: 'Bhrigu Samhita & Nadi Jyotisha',
      generatedAt: new Date().toISOString(),
      confidence: typeof data.confidence === 'number' ? data.confidence : undefined,
    },
  };
}

/**
 * Parse string response
 */
function parseStringResponse(
  text: string,
  timeframe: PredictionTimeframe,
  zodiacSign: string
): PredictionViewData {
  // Try to parse as JSON first
  try {
    const parsed = JSON.parse(text);
    return parsePredictionToViewData(parsed, timeframe, zodiacSign);
  } catch {
    // Not JSON, treat as plain text
  }

  // Clean the text content
  const cleaned = cleanPredictionContent(text);

  return {
    timeframe,
    zodiacSign,
    energy: 'Positive',
    energyScore: 75,
    overall: cleaned || createDefaultOverall(timeframe),
    categories: createDefaultCategories(),
    luckyElements: createDefaultLuckyElements(),
    metadata: {
      tradition: 'Bhrigu Samhita & Nadi Jyotisha',
      generatedAt: new Date().toISOString(),
    },
  };
}

/**
 * Helper functions
 */
function mapEnergyLevel(level: string | undefined): 'Positive' | 'Neutral' | 'Challenging' {
  if (!level) return 'Positive';
  const l = level.toLowerCase();
  if (['excellent', 'high', 'good'].includes(l)) return 'Positive';
  if (['moderate', 'balanced'].includes(l)) return 'Neutral';
  return 'Challenging';
}

function createDefaultCategory(message: string): CategoryRating {
  return { rating: 4, message };
}

function createDefaultCategories() {
  return {
    love: createDefaultCategory('Romantic energies are favorable. Express your feelings with confidence.'),
    career: createDefaultCategory('Professional opportunities arise. Stay focused on your goals.'),
    health: createDefaultCategory('Physical vitality supports your activities. Maintain balance.'),
    finance: createDefaultCategory('Financial stability indicated. Plan wisely for growth.'),
  };
}

function createDefaultLuckyElements(): LuckyElements {
  const now = new Date();
  const dayNumber = (now.getDate() + now.getMonth()) % 9 + 1;
  const colors = ['Electric Blue', 'Golden Yellow', 'Royal Purple', 'Emerald Green', 'Ruby Red', 'Silver White', 'Orange'];
  const directions = ['East', 'Northeast', 'North', 'Northwest', 'West', 'Southwest', 'South', 'Southeast'];

  return {
    number: dayNumber,
    color: colors[now.getDay()] ?? '',
    direction: directions[now.getDay()],
    time: '7:00 AM',
  };
}

function createDefaultOverall(timeframe: PredictionTimeframe): string {
  const overalls: Record<PredictionTimeframe, string> = {
    daily: 'Today brings opportunities for growth and new beginnings. The cosmic energies align in your favor, supporting both personal and professional endeavors.',
    weekly: 'This week focuses on personal development and relationships. Balance work with self-care for optimal results.',
    monthly: 'This month offers significant progress in career and personal goals. Stay focused and persistent in your efforts.',
    yearly: 'This year is transformative, bringing major life changes and spiritual growth. Embrace the journey with an open heart.',
  };
  return overalls[timeframe];
}

function createFallbackViewData(
  timeframe: PredictionTimeframe,
  zodiacSign: string
): PredictionViewData {
  return {
    timeframe,
    zodiacSign,
    energy: 'Positive',
    energyScore: 75,
    overall: createDefaultOverall(timeframe),
    categories: createDefaultCategories(),
    luckyElements: createDefaultLuckyElements(),
    metadata: {
      tradition: 'Bhrigu Samhita & Nadi Jyotisha',
      generatedAt: new Date().toISOString(),
    },
    offline: true,
  };
}

function extractOverallFromSections(sections: Record<string, string>): string {
  // Priority order for overall summary
  const priorityKeys = ['summary', 'daily_forecast', 'overall', 'actionable_guidance'];

  for (const key of priorityKeys) {
    if (sections[key]) {
      return cleanPredictionContent(sections[key]!);
    }
  }

  // Combine all sections
  const allContent = Object.values(sections)
    .filter(v => typeof v === 'string')
    .map(v => cleanPredictionContent(v))
    .join(' ');

  return allContent.substring(0, 500) || '';
}

function extractSections(data: Record<string, unknown>): Record<string, string> {
  if (data.sections && typeof data.sections === 'object') {
    const sections = data.sections as Record<string, string>;
    const cleaned: Record<string, string> = {};

    for (const [key, value] of Object.entries(sections)) {
      if (typeof value === 'string' && value.trim()) {
        cleaned[key] = cleanPredictionContent(value);
      }
    }

    return cleaned;
  }
  return {};
}

function extractCategories(data: Record<string, unknown>) {
  const categories = createDefaultCategories();

  // Check for categories object
  if (data.categories && typeof data.categories === 'object') {
    const cats = data.categories as Record<string, unknown>;

    for (const key of ['love', 'career', 'health', 'finance'] as const) {
      if (cats[key] && typeof cats[key] === 'object') {
        const cat = cats[key] as Record<string, unknown>;
        categories[key] = {
          rating: typeof cat.rating === 'number' ? cat.rating : 4,
          message: typeof cat.message === 'string'
            ? cleanPredictionContent(cat.message)
            : categories[key].message,
          advice: typeof cat.advice === 'string' ? cat.advice : undefined,
        };
      }
    }
  }

  // Check for individual category fields
  for (const key of ['love', 'career', 'health', 'finance'] as const) {
    if (data[key] && typeof data[key] === 'string') {
      categories[key] = {
        ...categories[key],
        message: cleanPredictionContent(data[key] as string),
      };
    }
  }

  return categories;
}

function extractLuckyElements(data: Record<string, unknown>): LuckyElements {
  const defaults = createDefaultLuckyElements();

  // Check various field names
  const lucky = (data.lucky_elements || data.luckyElements || data.lucky || {}) as Record<string, unknown>;

  return {
    number: extractNumber(lucky.number || data.lucky_number) ?? defaults.number,
    color: String(lucky.color || data.lucky_color || defaults.color),
    direction: String(lucky.direction || defaults.direction),
    time: String(lucky.time || defaults.time),
    gemstone: lucky.gemstone ? String(lucky.gemstone) : undefined,
    auspicious_hours: Array.isArray(lucky.auspicious_hours) ? lucky.auspicious_hours : undefined,
  };
}

function extractNumber(value: unknown): number | null {
  if (typeof value === 'number') return value;
  if (typeof value === 'string') {
    const parsed = parseInt(value, 10);
    return isNaN(parsed) ? null : parsed;
  }
  return null;
}

function extractMetadata(data: Record<string, unknown>, fallbackZodiac: string) {
  const meta = (data.metadata || {}) as Record<string, unknown>;

  return {
    zodiacSign: String(meta.zodiac_sign || data.zodiac_sign || fallbackZodiac),
    moonSign: meta.moon_sign ? String(meta.moon_sign) : undefined,
    nakshatra: meta.nakshatra ? String(meta.nakshatra) : undefined,
    ascendant: meta.ascendant ? String(meta.ascendant) : undefined,
    dasha: meta.dasha ? String(meta.dasha) : undefined,
  };
}

function determineEnergy(data: Record<string, unknown>): 'Positive' | 'Neutral' | 'Challenging' {
  // Check energy_level
  if (data.energy_level && typeof data.energy_level === 'object') {
    const el = data.energy_level as Record<string, unknown>;
    return mapEnergyLevel(String(el.level || ''));
  }

  // Check overall energy
  if (data.overall && typeof data.overall === 'object') {
    const o = data.overall as Record<string, unknown>;
    return mapEnergyLevel(String(o.energy || ''));
  }

  return 'Positive';
}

function extractEnergyScore(data: Record<string, unknown>): number {
  // Check energy_level
  if (data.energy_level && typeof data.energy_level === 'object') {
    const el = data.energy_level as Record<string, unknown>;
    if (typeof el.score === 'number') return el.score;
  }

  // Check overall rating
  if (data.overall && typeof data.overall === 'object') {
    const o = data.overall as Record<string, unknown>;
    if (typeof o.rating === 'number') return o.rating;
  }

  return 75;
}

function extractList(data: Record<string, unknown>, keys: string[]): string[] {
  for (const key of keys) {
    const value = data[key];
    if (Array.isArray(value)) {
      return value.filter(v => typeof v === 'string').map(v => cleanPredictionContent(v));
    }
  }
  return [];
}

// ============================================================================
// EXPORT
// ============================================================================

const predictionContentUtils = {
  cleanPredictionContent,
  parsePrediction,
  parsePredictionToViewData,
  formatSectionTitle,
  validatePredictionContent,
};

export default predictionContentUtils;
