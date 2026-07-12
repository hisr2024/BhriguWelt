/**
 * Unit tests for text simplification functions
 *
 * Tests the simplifyContent, filterSectionsByViewMode, and getSimplifiedSectionContent functions
 * from BhriguPredictionView.tsx
 */

// Mock functions extracted from BhriguPredictionView.tsx for testing
const simplifyContent = (content: string | null | undefined): string => {
  if (!content || typeof content !== 'string') {
    return '';
  }

  let simplified = content;

  // Pattern removal
  simplified = simplified.replace(/\((?:Bikaner|Pune Modi|Jaipur|Mumbai)\s+\d+[a-z]?\)/gi, '');
  simplified = simplified.replace(/\((?:Chidambaram|Vaitheeswaran Koil|Nadi Palm)\s+\d+[a-z]?\)/gi, '');
  simplified = simplified.replace(/\([A-Z]{2,3}-\d+\)/g, '');
  simplified = simplified.replace(/\[(?:Sanskrit|Skt):\s*[^\]]+\]/gi, '');
  simplified = simplified.replace(/\{?\s*"?confidence"?\s*:\s*\d*\.?\d+\s*\}?/gi, '');
  simplified = simplified.replace(/\s+(?:in|from|to|aspecting)\s+the\s+(?:first|second|third|fourth|fifth|sixth|seventh|eighth|ninth|tenth|eleventh|twelfth)\s+house\b/gi, '');
  simplified = simplified.replace(/[\[\(](?:Chart|See Chart|Ref):\s*[^\]\)]+[\]\)]/gi, '');

  // Phrase transformations
  simplified = simplified.replace(/\b(?:the\s+)?native'?s\b/gi, 'your');
  simplified = simplified.replace(/\bthe\s+native\b/gi, 'you');
  simplified = simplified.replace(/\bthe\s+chart\s+shows\b/gi, 'your birth chart reveals');
  simplified = simplified.replace(/\bindicate[sd]?\b/gi, (match) => {
    const lower = match.toLowerCase();
    const replacement = lower === 'indicated' ? 'suggested' : lower === 'indicate' ? 'suggest' : 'suggests';
    return match[0] === match[0].toUpperCase()
      ? replacement[0].toUpperCase() + replacement.slice(1)
      : replacement;
  });
  simplified = simplified.replace(/\bsignifies\b/gi, (match) => {
    return match[0] === match[0].toUpperCase() ? 'Points to' : 'points to';
  });
  simplified = simplified.replace(/\b(?:the\s+)?individual'?s\b/gi, 'your');
  simplified = simplified.replace(/\bthe\s+individual\b/gi, 'you');
  simplified = simplified.replace(/\bone\s+will\b/gi, 'you will');
  simplified = simplified.replace(/\bone'?s\b/gi, 'your');

  // Post-processing
  simplified = simplified.replace(/[ \t]{2,}/g, ' ');
  simplified = simplified.replace(/\n{3,}/g, '\n\n');
  simplified = simplified.trim();

  const lines = simplified.split('\n');
  const processedLines = lines.map((line) => {
    const trimmedLine = line.trim();
    if (!trimmedLine) return trimmedLine;

    const lastChar = trimmedLine[trimmedLine.length - 1];
    const hasPunctuation = /[.!?;:]/.test(lastChar);

    if (!hasPunctuation && trimmedLine.length > 20 && !trimmedLine.endsWith(':')) {
      return trimmedLine + '.';
    }

    return trimmedLine;
  });

  simplified = processedLines.join('\n');
  simplified = simplified.replace(/\(\s*\)/g, '');
  simplified = simplified.replace(/\[\s*\]/g, '');
  simplified = simplified.replace(/\s+([.,!?;:])/g, '$1');
  simplified = simplified.replace(/([.,!?;:])[ \t]{2,}/g, '$1 ');

  return simplified;
};

// Test Suite
describe('Text Simplification Functions', () => {

  describe('simplifyContent', () => {

    test('should remove folio references', () => {
      const input = "The native will succeed (Bikaner 12b) in their endeavors.";
      const expected = "you will succeed in their endeavors.";
      expect(simplifyContent(input)).toBe(expected);
    });

    test('should remove Nadi references', () => {
      const input = "Success is indicated (Chidambaram 7a) for the native.";
      const expected = "Success is suggested for you.";
      expect(simplifyContent(input)).toBe(expected);
    });

    test('should remove Dasha codes', () => {
      const input = "Period of growth (ND-5) is approaching.";
      const expected = "Period of growth is approaching.";
      expect(simplifyContent(input)).toBe(expected);
    });

    test('should remove Sanskrit bracketed terms', () => {
      const input = "The native has strong dharma [Sanskrit: righteousness].";
      const expected = "you has strong dharma.";
      expect(simplifyContent(input)).toBe(expected);
    });

    test('should remove confidence scores', () => {
      const input = "Success is likely {\"confidence\": 0.9} in career.";
      const expected = "Success is likely in career.";
      expect(simplifyContent(input)).toBe(expected);
    });

    test('should remove technical house references', () => {
      const input = "Jupiter in the seventh house brings happiness.";
      const expected = "Jupiter brings happiness.";
      expect(simplifyContent(input)).toBe(expected);
    });

    test('should transform "the native" to "you"', () => {
      const input = "The native will experience success in life.";
      const expected = "you will experience success in life.";
      expect(simplifyContent(input)).toBe(expected);
    });

    test('should transform "native\'s" to "your"', () => {
      const input = "The native's career will flourish.";
      const expected = "your career will flourish.";
      expect(simplifyContent(input)).toBe(expected);
    });

    test('should transform "the chart shows" to "your birth chart reveals"', () => {
      const input = "The chart shows promising opportunities.";
      const expected = "your birth chart reveals promising opportunities.";
      expect(simplifyContent(input)).toBe(expected);
    });

    test('should transform "indicates" to "suggests"', () => {
      const input = "This indicates success. It indicates prosperity.";
      const expected = "This suggests success. It suggests prosperity.";
      expect(simplifyContent(input)).toBe(expected);
    });

    test('should transform "signifies" to "points to"', () => {
      const input = "This signifies growth. It Signifies change.";
      const expected = "This points to growth. It Points to change.";
      expect(simplifyContent(input)).toBe(expected);
    });

    test('should handle null input', () => {
      expect(simplifyContent(null)).toBe('');
    });

    test('should handle undefined input', () => {
      expect(simplifyContent(undefined)).toBe('');
    });

    test('should handle empty string', () => {
      expect(simplifyContent('')).toBe('');
    });

    test('should remove extra whitespace', () => {
      const input = "Text  with    multiple     spaces.";
      const expected = "Text with multiple spaces.";
      expect(simplifyContent(input)).toBe(expected);
    });

    test('should add periods to sentences without punctuation', () => {
      const input = "This is a long sentence without punctuation at the end";
      const result = simplifyContent(input);
      expect(result.endsWith('.')).toBe(true);
    });

    test('should preserve paragraph breaks', () => {
      const input = "First paragraph.\n\n\n\nSecond paragraph.";
      const result = simplifyContent(input);
      expect(result).toBe("First paragraph.\n\nSecond paragraph.");
    });

    test('should handle complex real-world content', () => {
      const input = `The native will experience success (Bikaner 12b) in the seventh house [Sanskrit: dharma].
The chart shows {"confidence": 0.95} prosperity.
The native's career indicates growth (ND-123).`;

      const result = simplifyContent(input);

      expect(result).not.toContain('(Bikaner 12b)');
      expect(result).not.toContain('[Sanskrit: dharma]');
      expect(result).not.toContain('{"confidence": 0.95}');
      expect(result).not.toContain('in the seventh house');
      expect(result).toContain('you');
      expect(result).toContain('your');
      expect(result).toContain('suggests');
    });
  });

  describe('filterSectionsByViewMode', () => {

    type CategorySectionConfig = {
      key: string;
      titleKey: string;
      titleVariants: string[];
      color: string;
    };

    const mockSections: CategorySectionConfig[] = [
      { key: 'career', titleKey: 'career', titleVariants: ['Career'], color: 'cyan' },
      { key: 'technical_analysis', titleKey: 'technical', titleVariants: ['Technical'], color: 'purple' },
      { key: 'planetary_combinations', titleKey: 'planetary', titleVariants: ['Planetary'], color: 'blue' },
      { key: 'health', titleKey: 'health', titleVariants: ['Health'], color: 'green' },
      { key: 'dosha_identification', titleKey: 'dosha', titleVariants: ['Dosha'], color: 'red' },
    ];

    const filterSectionsByViewMode = (
      sections: CategorySectionConfig[],
      viewMode: 'layman' | 'astrologer'
    ): CategorySectionConfig[] => {
      if (!sections || sections.length === 0) {
        return [];
      }

      if (viewMode === 'astrologer') {
        return sections;
      }

      const technicalKeywords = [
        'technical',
        'planetary_combinations',
        'dosha_identification',
        'ashtakavarga',
        'bhava_analysis',
        'divisional_charts',
      ];

      return sections.filter((section) => {
        const sectionKey = section.key.toLowerCase();
        return !technicalKeywords.some((keyword) => sectionKey.includes(keyword));
      });
    };

    test('should return all sections for astrologer mode', () => {
      const result = filterSectionsByViewMode(mockSections, 'astrologer');
      expect(result).toHaveLength(5);
      expect(result).toEqual(mockSections);
    });

    test('should filter technical sections for layman mode', () => {
      const result = filterSectionsByViewMode(mockSections, 'layman');
      expect(result).toHaveLength(2);
      expect(result.map(s => s.key)).toEqual(['career', 'health']);
    });

    test('should handle empty sections array', () => {
      const result = filterSectionsByViewMode([], 'layman');
      expect(result).toHaveLength(0);
    });
  });

  describe('getSimplifiedSectionContent', () => {

    const getSimplifiedSectionContent = (
      content: string | null | undefined,
      viewMode: 'layman' | 'astrologer'
    ): string => {
      if (!content) {
        return '';
      }

      if (viewMode === 'astrologer') {
        return typeof content === 'string' ? content : '';
      }

      return simplifyContent(content);
    };

    test('should return simplified content in layman mode', () => {
      const input = "The native will succeed (Bikaner 12b).";
      const result = getSimplifiedSectionContent(input, 'layman');
      expect(result).toBe("you will succeed.");
    });

    test('should return original content in astrologer mode', () => {
      const input = "The native will succeed (Bikaner 12b).";
      const result = getSimplifiedSectionContent(input, 'astrologer');
      expect(result).toBe(input);
    });

    test('should handle null content', () => {
      expect(getSimplifiedSectionContent(null, 'layman')).toBe('');
      expect(getSimplifiedSectionContent(null, 'astrologer')).toBe('');
    });

    test('should handle undefined content', () => {
      expect(getSimplifiedSectionContent(undefined, 'layman')).toBe('');
      expect(getSimplifiedSectionContent(undefined, 'astrologer')).toBe('');
    });
  });
});

// Example usage and manual testing
console.log('\n=== TEXT SIMPLIFICATION EXAMPLES ===\n');

const examples = [
  "The native will experience prosperity (Bikaner 12b) in the seventh house.",
  "The chart shows [Sanskrit: dharma] with high confidence: 0.95.",
  "The individual's success indicates (ND-5) positive outcomes.",
  "One will achieve greatness aspecting the tenth house (Chidambaram 7a).",
];

examples.forEach((example, index) => {
  console.log(`Example ${index + 1}:`);
  console.log(`Input:  "${example}"`);
  console.log(`Output: "${simplifyContent(example)}"`);
  console.log('');
});
