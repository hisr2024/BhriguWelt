# Text Simplification for Astrology Readings

## Overview

This document describes the text simplification system implemented in `BhriguPredictionView.tsx` to transform technical astrological content into simple, personalized, easy-to-understand text.

## Features

### 1. View Mode Toggle
- **Layman Mode**: Simplifies technical terms, removes jargon, personalizes content
- **Astrologer Mode**: Shows full technical details with all references intact
- UI toggle in the header next to language selector

### 2. Pattern Removal

The system removes the following technical patterns:

#### Folio References
- **Pattern**: `(Bikaner 12b, Pune Modi 3c, Jaipur 5a, Mumbai 8b)`
- **Example**: "The native will succeed (Bikaner 12b)" → "You will succeed"

#### Nadi References
- **Pattern**: `(Chidambaram 7a, Vaitheeswaran Koil 12c, Nadi Palm 3b)`
- **Example**: "Success indicated (Chidambaram 7a)" → "Success suggested"

#### Dasha Codes
- **Pattern**: `(ND-5), (BR-123), (VD-456)`
- **Example**: "Period of growth (ND-5)" → "Period of growth"

#### Sanskrit Bracketed Terms
- **Pattern**: `[Sanskrit: dharma], [Skt: karma]`
- **Example**: "Strong dharma [Sanskrit: righteousness]" → "Strong dharma"

#### Confidence Scores
- **Pattern**: `{"confidence": 0.9}, confidence: 0.95`
- **Example**: "Success likely {\"confidence\": 0.9}" → "Success likely"

#### Technical House References
- **Pattern**: "in the seventh house", "aspecting the tenth"
- **Example**: "Jupiter in the seventh house" → "Jupiter"

#### Chart Reference Markers
- **Pattern**: `[Chart: XYZ], (See Chart 5)`
- **Example**: "See details [Chart: 5]" → "See details"

### 3. Phrase Transformations

The system applies personalization transformations:

| Original | Transformed | Capitalization |
|----------|-------------|----------------|
| "the native" | "you" | Preserved |
| "native's" | "your" | Preserved |
| "the chart shows" | "your birth chart reveals" | Preserved |
| "indicates" | "suggests" | Preserved |
| "signifies" | "points to" | Preserved |
| "the individual" | "you" | Preserved |
| "individual's" | "your" | Preserved |
| "one will" | "you will" | Preserved |
| "one's" | "your" | Preserved |

**Examples:**
- "The native will succeed" → "You will succeed"
- "The native's career" → "Your career"
- "The chart shows prosperity" → "Your birth chart reveals prosperity"
- "This indicates success" → "This suggests success"
- "It signifies growth" → "It points to growth"

### 4. Post-Processing

The system cleans up formatting:

- **Multiple Spaces**: Converts `"Text    with     spaces"` → `"Text with spaces"`
- **Multiple Newlines**: Preserves paragraph breaks (double newlines), removes extras
- **Punctuation**: Adds periods to sentences > 20 chars without punctuation
- **Empty Brackets**: Removes `()` and `[]`
- **Spacing**: Cleans up spacing around punctuation marks

## Implementation

### Core Functions

#### 1. `simplifyContent(content: string | null | undefined): string`

Simplifies technical astrological content for layman understanding.

**Parameters:**
- `content`: Raw astrological text with technical terms

**Returns:**
- Simplified, personalized text

**Edge Cases:**
- Returns empty string for null/undefined/empty input
- Preserves paragraph breaks (double newlines)
- Handles mixed case transformations

**Example:**
```typescript
const input = "The native will experience success (Bikaner 12b) in the seventh house.";
const output = simplifyContent(input);
// Output: "You will experience success."
```

#### 2. `filterSectionsByViewMode(sections: CategorySectionConfig[], viewMode: 'layman' | 'astrologer'): CategorySectionConfig[]`

Filters sections based on view mode.

**Parameters:**
- `sections`: Array of section configurations
- `viewMode`: Current view mode ('layman' or 'astrologer')

**Returns:**
- Filtered sections array

**Layman Mode Exclusions:**
- technical
- planetary_combinations
- dosha_identification
- ashtakavarga
- bhava_analysis
- divisional_charts
- varga
- dasha_analysis
- transit_technical
- yogas
- aspects

**Example:**
```typescript
const sections = [
  { key: 'career', ... },
  { key: 'technical_analysis', ... },
  { key: 'health', ... }
];

const laymanSections = filterSectionsByViewMode(sections, 'layman');
// Returns: [career, health] - technical_analysis excluded
```

#### 3. `getSimplifiedSectionContent(content: string | null | undefined, viewMode: 'layman' | 'astrologer'): string`

Gets section content with optional simplification based on view mode.

**Parameters:**
- `content`: Raw section content
- `viewMode`: Current view mode

**Returns:**
- Original or simplified content based on view mode

**Logic:**
- Layman mode: Applies `simplifyContent()`
- Astrologer mode: Returns original content unchanged
- Handles null/undefined gracefully

**Example:**
```typescript
const content = "The native succeeds (Bikaner 12b).";

getSimplifiedSectionContent(content, 'layman');
// Output: "You succeeds."

getSimplifiedSectionContent(content, 'astrologer');
// Output: "The native succeeds (Bikaner 12b)."
```

## Integration Points

### 1. State Management

```typescript
const [viewMode, setViewMode] = useState<'layman' | 'astrologer'>('layman');
```

### 2. UI Toggle

Located in the header section, next to the language selector:

```tsx
<select
  id="view-mode"
  value={viewMode}
  onChange={(e) => setViewMode(e.target.value as 'layman' | 'astrologer')}
  title="Layman mode simplifies technical terms, Astrologer mode shows full technical details"
>
  <option value="layman">Layman</option>
  <option value="astrologer">Astrologer</option>
</select>
```

### 3. Section Filtering

```typescript
const allSections = CATEGORY_SECTIONS[normalizedCategory] || [];
const sections = filterSectionsByViewMode(allSections, viewMode);
```

### 4. Content Simplification

```typescript
const getSectionContent = (key: string): string => {
  const directContent = predictionData[key];
  let rawContent: string;

  if (typeof directContent === 'string') {
    rawContent = directContent;
  } else {
    rawContent = parsedFromFullAnalysis[key] || '';
  }

  return getSimplifiedSectionContent(rawContent, viewMode);
};
```

### 5. Full Analysis Simplification

```tsx
<div className="text-slate-100/90 ...">
  {getSimplifiedSectionContent(predictionData.full_analysis, viewMode)}
</div>
```

## Performance Considerations

1. **Memoization**: Functions are defined inside the component but could be memoized with `useMemo` if performance issues arise
2. **Regex Optimization**: All regex patterns are pre-compiled and efficient
3. **String Operations**: Uses native JavaScript string methods for optimal performance
4. **Edge Cases**: All functions handle null/undefined gracefully to prevent runtime errors

## Testing

Comprehensive unit tests are provided in:
- `/frontend/app/components/__tests__/textSimplification.test.ts`

Test coverage includes:
- Pattern removal for all supported types
- Phrase transformations with case preservation
- Post-processing and formatting
- Edge cases (null, undefined, empty strings)
- Integration scenarios with complex real-world content

## Usage Examples

### Example 1: Career Reading

**Input (Astrologer Mode):**
```
The native will experience success in the tenth house (Bikaner 12b).
The chart shows strong planetary combinations [Sanskrit: yoga].
This indicates {"confidence": 0.95} career advancement (ND-123).
```

**Output (Layman Mode):**
```
You will experience success.
Your birth chart reveals strong planetary combinations.
This suggests career advancement.
```

### Example 2: Relationship Reading

**Input (Astrologer Mode):**
```
The native's relationships signify karmic connections (Chidambaram 7a).
One will meet their soulmate in the seventh house.
Native's partner indicates [Skt: dharma] alignment.
```

**Output (Layman Mode):**
```
Your relationships points to karmic connections.
You will meet their soulmate.
Your partner suggests alignment.
```

## Future Enhancements

Potential improvements:
1. **Customizable Patterns**: Allow users to configure which patterns to remove
2. **Translation Support**: Apply simplification in multiple languages
3. **Glossary Links**: Add tooltips for simplified terms
4. **Progressive Disclosure**: Show full technical details on hover
5. **User Preferences**: Save view mode preference in user settings
6. **Analytics**: Track which mode users prefer

## Maintenance

When adding new technical patterns:
1. Add regex pattern to `simplifyContent` function
2. Document the pattern in this file
3. Add unit tests in `textSimplification.test.ts`
4. Update examples with before/after samples

## Troubleshooting

### Content Not Simplifying
- Check that view mode is set to 'layman'
- Verify content is not null/undefined
- Ensure function is being called on content

### Technical Sections Still Showing
- Check `filterSectionsByViewMode` keyword list
- Verify section key matches a technical keyword
- Ensure view mode is set correctly

### Formatting Issues
- Review post-processing regex patterns
- Check for conflicting transformations
- Verify whitespace handling

## License

Part of BhriguWelt project - All rights reserved.
