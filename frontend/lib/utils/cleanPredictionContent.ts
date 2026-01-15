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
      model: String((data.metadata as any)?.model || 'unknown'),
      version: String((data.metadata as any)?.version || '1.0'),
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
// EXPORT
// ============================================================================

export default {
  cleanPredictionContent,
  parsePrediction,
  formatSectionTitle,
  validatePredictionContent,
};
