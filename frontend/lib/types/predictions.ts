/**
 * Enhanced Prediction Type System
 * Strict typing for all prediction-related data structures
 * Supports Bhrigu Samhita and Nadi Jyotisha based predictions
 */

export type PredictionTimeframe = 'daily' | 'weekly' | 'monthly' | 'yearly';

export interface PredictionSection {
  id: string;
  title: string;
  content: string;
  confidence?: number;
  metadata?: {
    sources?: string[];
    techniques?: string[];
    timestamp?: string;
  };
}

export interface CategoryRating {
  rating: number; // 1-5 stars
  message: string;
  advice?: string;
  summary?: string;
}

export interface LuckyElements {
  number: number;
  color: string;
  gemstone?: string;
  direction?: string;
  time?: string;
  auspicious_hours?: string[];
}

export interface PredictionSections {
  bhrigu_samhita_insights?: string;
  nadi_jyotisha_revelations?: string;
  planetary_combinations_analysis?: string;
  doshas_and_remedies?: string;
  timing_and_dasha_analysis?: string;
  daily_forecast?: string;
  actionable_guidance?: string;
  [key: string]: string | undefined;
}

export interface ParsedPrediction {
  id: string;
  category: string;
  summary: string;
  sections: PredictionSection[];
  confidence: number;
  generatedAt: string;
  metadata?: {
    model?: string;
    version?: string;
    processingTime?: number;
  };
}

export interface RawPrediction {
  summary?: string;
  sections?: Record<string, string> | PredictionSection[];
  confidence?: number;
  [key: string]: unknown;
}

export interface PredictionDisplayProps {
  prediction: RawPrediction | ParsedPrediction | string | null;
  category: string;
  userId?: string;
  onRefresh?: () => void;
  onShare?: (method: ShareMethod) => void;
  onExport?: (format: ExportFormat) => void;
}

export type ShareMethod = 'native' | 'whatsapp' | 'email' | 'copy' | 'twitter';
export type ExportFormat = 'txt' | 'pdf' | 'json' | 'markdown' | 'image' | 'png';

export interface ContentCleaningOptions {
  removeIntroductions?: boolean;
  removeTechnicalTerms?: boolean;
  simplifyLanguage?: boolean;
  maxLength?: number;
}

// Daily Insight Response from the API
export interface DailyInsightResponse {
  date: string;
  day_of_week: string;
  day_ruler: {
    planet: string;
    deity: string;
    color: string;
    element: string;
  };
  energy_level: {
    level: string;
    score: number;
    description: string;
  };
  overall: {
    energy: string;
    rating: number;
    message: string;
  };
  categories: {
    love: CategoryRating;
    career: CategoryRating;
    health: CategoryRating;
    finance: CategoryRating;
    spiritual?: CategoryRating & {
      deity?: string;
      mantra?: string;
      practice?: string;
    };
  };
  do_list: string[];
  dont_list: string[];
  lucky_elements: LuckyElements;
  nakshatra_energy?: {
    quality: string;
    focus: string;
    energy: string;
  };
  zodiac_theme?: {
    strength: string;
    challenge: string;
    focus: string;
    element: string;
  };
  metadata: {
    zodiac_sign: string;
    moon_sign?: string;
    nakshatra?: string;
    ascendant?: string;
    tradition: string;
    generated_at: string;
  };
}

// Weekly Forecast Response
export interface WeeklyForecastResponse {
  week_start: string;
  week_end: string;
  weekly_theme: string;
  daily_forecasts: Array<{
    date: string;
    day_name: string;
    summary: string;
    energy: {
      level: string;
      score: number;
    };
    focus: string;
    lucky_number: number;
  }>;
  best_days: string[];
  challenging_days: string[];
  weekly_advice: string;
  metadata: {
    zodiac_sign: string;
    moon_sign?: string;
    tradition: string;
    generated_at: string;
  };
}

// Monthly Forecast Response
export interface MonthlyForecastResponse {
  month: number;
  year: number;
  month_name: string;
  overview: string;
  categories: {
    love: CategoryRating & { single?: string; coupled?: string };
    career: CategoryRating & { focus?: string; opportunity?: string };
    health: CategoryRating & { focus?: string; practice?: string };
    finance: CategoryRating & { opportunity?: string; caution?: string };
    spiritual?: CategoryRating & { practice?: string; insight?: string };
  };
  important_dates: Array<{
    date: string;
    event: string;
  }>;
  monthly_mantra: string;
  power_days: string[];
  metadata: {
    zodiac_sign: string;
    moon_sign?: string;
    nakshatra?: string;
    tradition: string;
    generated_at: string;
  };
}

// Yearly Forecast Response
export interface YearlyForecastResponse {
  year: number;
  theme: {
    title: string;
    summary: string;
    keywords: string[];
  };
  quarters: Array<{
    quarter: number;
    name: string;
    theme: string;
    focus_areas: string[];
    energy: string;
  }>;
  categories: {
    love: CategoryRating & { key_periods?: string[]; guidance?: string };
    career: CategoryRating & { key_periods?: string[]; guidance?: string };
    health: CategoryRating & { focus?: string; guidance?: string };
    finance: CategoryRating & { key_periods?: string[]; guidance?: string };
    spiritual?: CategoryRating & { practices?: string[]; guidance?: string };
  };
  key_months: Array<{
    month: string;
    theme: string;
  }>;
  annual_guidance: string;
  metadata: {
    zodiac_sign: string;
    moon_sign?: string;
    nakshatra?: string;
    dasha?: string;
    tradition: string;
    generated_at: string;
  };
}

// Unified Prediction View Data - what the UI displays
export interface PredictionViewData {
  timeframe: PredictionTimeframe;
  zodiacSign: string;
  energy: 'Positive' | 'Neutral' | 'Challenging';
  energyScore?: number;

  // Main prediction content
  overall: string;
  sections?: PredictionSections;

  // Category ratings
  categories: {
    love: CategoryRating;
    career: CategoryRating;
    health: CategoryRating;
    finance: CategoryRating;
    spiritual?: CategoryRating;
  };

  // Lucky elements
  luckyElements: LuckyElements;

  // Guidance
  dos?: string[];
  donts?: string[];

  // Optional details based on timeframe
  dailyDetails?: {
    date: string;
    dayOfWeek: string;
    dayRuler: { planet: string; deity: string };
    nakshatraEnergy?: { quality: string; focus: string };
  };

  weeklyDetails?: {
    weekStart: string;
    weekEnd: string;
    theme: string;
    bestDays: string[];
    challengingDays: string[];
    dailyForecasts: Array<{
      date: string;
      dayName: string;
      summary: string;
      energyScore: number;
    }>;
  };

  monthlyDetails?: {
    monthName: string;
    year: number;
    mantra: string;
    powerDays: string[];
    importantDates: Array<{ date: string; event: string }>;
  };

  yearlyDetails?: {
    year: number;
    themeTitle: string;
    keywords: string[];
    quarters: Array<{
      name: string;
      theme: string;
      focusAreas: string[];
    }>;
    keyMonths: Array<{ month: string; theme: string }>;
    annualGuidance: string;
  };

  // Metadata
  metadata: {
    moonSign?: string;
    nakshatra?: string;
    ascendant?: string;
    dasha?: string;
    tradition: string;
    generatedAt: string;
    confidence?: number;
  };

  // Flags
  offline?: boolean;
  cached?: boolean;
  cachedAt?: string;
}

// Union type for any forecast response
export type ForecastResponse =
  | DailyInsightResponse
  | WeeklyForecastResponse
  | MonthlyForecastResponse
  | YearlyForecastResponse;
