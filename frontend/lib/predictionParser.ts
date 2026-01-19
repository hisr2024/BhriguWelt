/**
 * Prediction Parser Utility
 * Handles parsing, filtering, and transforming prediction data for display
 */

export interface ParsedPrediction {
  summary: string;
  sections: PredictionSection[];
  metadata?: {
    confidence?: number;
    generatedAt?: string;
    [key: string]: any;
  };
}

export interface PredictionSection {
  key: string;
  title: string;
  content: string;
  icon?: string;
  priority?: number;
  color?: string;
}

/**
 * Parse raw prediction response into structured format
 * Handles both nested sections object and direct property format
 */
export function parsePredictionResponse(
  rawResponse: any,
  viewMode: 'layman' | 'astrologer' = 'layman'
): ParsedPrediction {
  if (!rawResponse) {
    return {
      summary: 'No prediction data available',
      sections: [],
    };
  }

  // Extract summary
  const summary = extractSummary(rawResponse);

  // Extract sections from various possible structures
  const sections = extractSections(rawResponse, viewMode);

  // Extract metadata
  const metadata = rawResponse.metadata || {
    generatedAt: rawResponse.generated_at || rawResponse.timestamp,
  };

  return {
    summary,
    sections,
    metadata,
  };
}

/**
 * Extract summary from prediction response
 */
function extractSummary(response: any): string {
  // Try direct summary field
  if (response.summary && typeof response.summary === 'string') {
    // Check if summary is a JSON string that needs parsing
    if (response.summary.trim().startsWith('{')) {
      try {
        const parsed = JSON.parse(response.summary);
        if (parsed.summary && typeof parsed.summary === 'string') {
          return cleanText(parsed.summary);
        }
      } catch (e) {
        // Not JSON, use as is
        return cleanText(response.summary);
      }
    }
    return cleanText(response.summary);
  }

  // Try introduction field
  if (response.introduction) {
    return cleanText(response.introduction);
  }

  // Try extracting from full_analysis
  if (response.full_analysis) {
    const firstParagraph = extractFirstParagraph(response.full_analysis);
    if (firstParagraph) {
      return firstParagraph;
    }
  }

  // Fallback
  return 'Your karmic journey is unfolding with purpose and meaning.';
}

/**
 * Extract first meaningful paragraph from text
 */
function extractFirstParagraph(text: string): string {
  const paragraphs = text
    .split(/\n\n+/)
    .map(p => p.trim())
    .filter(p => p.length > 50 && !p.startsWith('#') && !p.startsWith('**'));

  if (paragraphs.length > 0) {
    return cleanText(paragraphs[0]);
  }

  return '';
}

/**
 * Extract sections from prediction response
 * Handles multiple response formats:
 * 1. NEW: Subcategories object with title/content structure
 * 2. Nested sections object with markdown headers
 * 3. Direct properties on the response object
 * 4. Full_analysis that needs parsing
 */
export function extractSections(
  response: any,
  viewMode: 'layman' | 'astrologer' = 'layman'
): PredictionSection[] {
  const sections: PredictionSection[] = [];

  // Format 1 (NEW): Check for subcategories object (new API format)
  if (response.subcategories && typeof response.subcategories === 'object') {
    const subcategories = response.subcategories;

    Object.entries(subcategories).forEach(([key, value], index) => {
      if (value && typeof value === 'object') {
        const subcatData = value as { title?: string; content?: string };
        const content = subcatData.content;
        const title = subcatData.title || formatSectionTitle(key);

        if (content && typeof content === 'string' && content.trim().length > 20) {
          const filteredContent = filterContentByViewMode(content, viewMode);

          if (filteredContent.trim().length > 0) {
            sections.push({
              key: cleanSectionKey(key),
              title: cleanSectionTitle(title),
              content: filteredContent,
              priority: index,
            });
          }
        }
      }
    });

    // If we found subcategories, return them
    if (sections.length > 0) {
      return sections;
    }
  }

  // Format 2: Check for nested sections object
  if (response.sections && typeof response.sections === 'object') {
    // Handle string that looks like JSON
    let sectionsObj = response.sections;

    if (typeof sectionsObj === 'string' && sectionsObj.trim().startsWith('{')) {
      try {
        sectionsObj = JSON.parse(sectionsObj);
      } catch (e) {
        console.warn('Failed to parse sections string:', e);
        sectionsObj = {};
      }
    }

    // Extract sections from object
    if (typeof sectionsObj === 'object') {
      Object.entries(sectionsObj).forEach(([key, value], index) => {
        if (typeof value === 'string' && value.trim().length > 20) {
          const cleanedKey = cleanSectionKey(key);
          const content = filterContentByViewMode(value, viewMode);

          if (content.trim().length > 0) {
            sections.push({
              key: cleanedKey,
              title: cleanSectionTitle(key),
              content: content,
              priority: index,
            });
          }
        }
      });
    }
  }

  // Format 3: Direct properties (existing format)
  if (sections.length === 0) {
    const knownSectionKeys = [
      // Life events
      'yearly_forecast', 'marriage_timing', 'career_milestones', 'children_family',
      'financial_events', 'health_alerts', 'spiritual_milestones', 'relocations',
      'education', 'favorable_periods', 'challenging_periods', 'transits', 'age_milestones',
      // Relationships
      'romantic_marriage', 'family', 'soul_connections', 'friendships', 'professional',
      'karmic_patterns', 'communication', 'timing', 'healing', 'healthy_practices',
      // Predictions
      'daily', 'weekly', 'monthly', 'yearly', 'overall', 'love', 'career', 'health', 'finance',
      // General
      'soul_purpose', 'karmic_lessons', 'past_relationships', 'recent_life',
      'finances', 'spiritual_growth', 'relationships',
      'remedies', 'mantras', 'gemstones',
    ];

    knownSectionKeys.forEach((key, index) => {
      if (response[key] && typeof response[key] === 'string' && response[key].trim().length > 20) {
        const content = filterContentByViewMode(response[key], viewMode);

        if (content.trim().length > 0) {
          sections.push({
            key,
            title: formatSectionTitle(key),
            content: content,
            priority: index,
          });
        }
      }
    });
  }

  // Format 4: Parse from full_analysis if no sections found
  if (sections.length === 0 && response.full_analysis) {
    return parseSectionsFromMarkdown(response.full_analysis, viewMode);
  }

  return sections;
}

/**
 * Parse sections from markdown formatted text
 */
function parseSectionsFromMarkdown(
  markdown: string,
  viewMode: 'layman' | 'astrologer'
): PredictionSection[] {
  const sections: PredictionSection[] = [];

  // Split by markdown headers (##)
  const headerRegex = /^#{1,3}\s+(.+)$/gm;
  const matches = [...markdown.matchAll(headerRegex)];

  for (let i = 0; i < matches.length; i++) {
    const match = matches[i];
    const title = match[1].trim();
    const startPos = match.index! + match[0].length;
    const endPos = i < matches.length - 1 ? matches[i + 1].index! : markdown.length;

    const content = markdown.substring(startPos, endPos).trim();

    if (content.length > 20) {
      const filteredContent = filterContentByViewMode(content, viewMode);

      if (filteredContent.trim().length > 0) {
        sections.push({
          key: cleanSectionKey(title),
          title: cleanSectionTitle(title),
          content: filteredContent,
          priority: i,
        });
      }
    }
  }

  return sections;
}

/**
 * Filter content based on view mode (layman vs astrologer)
 * Removes technical astrological terms and sections for layman mode
 */
export function filterContentByViewMode(
  content: string,
  mode: 'layman' | 'astrologer'
): string {
  if (mode === 'astrologer') {
    return content; // Show everything for astrologer
  }

  // Layman mode: Remove technical sections and simplify language
  let filtered = content;

  // Remove entire technical sections
  const technicalSectionPatterns = [
    /##\s*Planetary Combinations.*?(?=##|$)/gis,
    /##\s*Doshas? and Remedies.*?(?=##|$)/gis,
    /##\s*Ashtakavarga.*?(?=##|$)/gis,
    /##\s*Technical Analysis.*?(?=##|$)/gis,
    /##\s*Bhava Analysis.*?(?=##|$)/gis,
    /##\s*Dasha Analysis.*?(?=##|$)/gis,
    /##\s*Transit Analysis.*?(?=##|$)/gis,
  ];

  technicalSectionPatterns.forEach(pattern => {
    filtered = filtered.replace(pattern, '');
  });

  // Remove technical terminology paragraphs
  const technicalPhrases = [
    /Moon in \d+(?:st|nd|rd|th) house[^.!?]*[.!?]/gi,
    /Jupiter aspects? [^.!?]*[.!?]/gi,
    /Saturn.*?conjunction[^.!?]*[.!?]/gi,
    /Rahu.*?Ketu[^.!?]*[.!?]/gi,
    /\d+° [A-Z][a-z]+ in [A-Z][a-z]+/g, // e.g., "23° Aries in 5th house"
    /Mahadasha of [^.!?]*[.!?]/gi,
    /Antardasha of [^.!?]*[.!?]/gi,
    /Vimshottari dasha[^.!?]*[.!?]/gi,
  ];

  technicalPhrases.forEach(pattern => {
    filtered = filtered.replace(pattern, '');
  });

  // Simplify remaining astrological terms
  const simplifications: [RegExp, string][] = [
    [/natal chart/gi, 'birth chart'],
    [/ascendant/gi, 'rising sign'],
    [/descendant/gi, 'relationship area'],
    [/midheaven/gi, 'career point'],
    [/imum coeli/gi, 'home point'],
    [/retrograde/gi, 'apparent backward motion'],
    [/conjunction/gi, 'close alignment'],
    [/opposition/gi, 'opposite positioning'],
    [/trine/gi, 'harmonious angle'],
    [/square/gi, 'challenging angle'],
  ];

  simplifications.forEach(([pattern, replacement]) => {
    filtered = filtered.replace(pattern, replacement);
  });

  // Clean up extra whitespace
  filtered = filtered.replace(/\n{3,}/g, '\n\n').trim();

  return filtered;
}

/**
 * Clean section key for use as identifier
 */
function cleanSectionKey(key: string): string {
  return key
    .toLowerCase()
    .replace(/^#+\s*/, '') // Remove markdown headers
    .replace(/^\d+\.\s*/, '') // Remove numbered lists
    .replace(/[^a-z0-9]+/g, '_') // Replace special chars with underscore
    .replace(/^_+|_+$/g, ''); // Remove leading/trailing underscores
}

/**
 * Clean section title for display
 */
function cleanSectionTitle(title: string): string {
  return title
    .replace(/^#+\s*/, '') // Remove markdown headers
    .replace(/^\d+\.\s*/, '') // Remove numbered lists
    .replace(/\*\*/g, '') // Remove bold markdown
    .replace(/\*/g, '') // Remove italic markdown
    .trim();
}

/**
 * Format section key into readable title
 */
function formatSectionTitle(key: string): string {
  return key
    .split('_')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

/**
 * Clean text by removing excessive formatting
 */
function cleanText(text: string): string {
  return text
    .replace(/\*\*\*(.+?)\*\*\*/g, '$1') // Remove bold+italic
    .replace(/\*\*(.+?)\*\*/g, '$1') // Remove bold
    .replace(/\*(.+?)\*/g, '$1') // Remove italic
    .replace(/`(.+?)`/g, '$1') // Remove code blocks
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1') // Remove links, keep text
    .replace(/\n{3,}/g, '\n\n') // Clean up multiple newlines
    .trim();
}

/**
 * Check if content is technical/astrological
 */
export function isTechnicalContent(content: string): boolean {
  const technicalKeywords = [
    'mahadasha',
    'antardasha',
    'vimshottari',
    'ashtakavarga',
    'bhava',
    'nakshatra lord',
    'planetary combinations',
    'dosha identification',
    'divisional chart',
    'navamsa',
    'conjunction',
    'opposition',
    'trine',
    'square',
    'sextile',
  ];

  const lowerContent = content.toLowerCase();
  return technicalKeywords.some(keyword => lowerContent.includes(keyword));
}

/**
 * Simplify content for layman understanding
 */
export function simplifyContent(text: string): string {
  if (!text) return '';

  return text
    .trim()
    .replace(/^#+\s*/gm, '') // Remove markdown headers
    .replace(/\*\*([^*]+)\*\*/g, '$1') // Remove bold
    .replace(/\*([^*]+)\*/g, '$1') // Remove italic
    .replace(/^\d+\.\s*/gm, '• ') // Convert numbered lists to bullets
    .replace(/^[•\-*]\s*/gm, '• ') // Normalize bullets
    .replace(/\n{3,}/g, '\n\n') // Clean up multiple newlines
    .replace(/\s{2,}/g, ' ') // Clean up multiple spaces
    .trim();
}

/**
 * Generate icon name for section based on key
 */
export function getSectionIconName(key: string): string {
  const iconMap: Record<string, string> = {
    soul_purpose: 'Sparkles',
    karmic_lessons: 'BookOpen',
    career: 'Briefcase',
    health: 'Heart',
    finances: 'DollarSign',
    spiritual_growth: 'Flame',
    relationships: 'Users',
    family: 'Home',
    education: 'GraduationCap',
    timing: 'Clock',
    remedies: 'Shield',
    mantras: 'Music',
    gemstones: 'Gem',
    daily: 'Sun',
    weekly: 'Calendar',
    monthly: 'CalendarRange',
    yearly: 'CalendarClock',
    past_lives: 'History',
    future_lives: 'Telescope',
    present_life: 'CircleDot',
  };

  return iconMap[key] || 'Star';
}
