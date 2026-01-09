const DEFAULT_SECTION_PARSER_MIN_LENGTH = 100;
const DEFAULT_SECTION_PARSER_HEADER_MIN_LENGTH = 50;
const DEFAULT_SECTION_PARSER_KEYWORD_MATCH_RATIO = 0.5;

const parseNumberEnv = (value: string | undefined, fallback: number): number => {
  if (!value) {
    return fallback;
  }
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
};

const clampRatio = (value: number, fallback: number): number => {
  if (value > 0 && value <= 1) {
    return value;
  }
  return fallback;
};

export const sectionParserConfig = {
  minSectionLength: parseNumberEnv(
    process.env.NEXT_PUBLIC_SECTION_PARSER_MIN_LENGTH,
    DEFAULT_SECTION_PARSER_MIN_LENGTH
  ),
  headerMinLength: parseNumberEnv(
    process.env.NEXT_PUBLIC_SECTION_PARSER_HEADER_MIN_LENGTH,
    DEFAULT_SECTION_PARSER_HEADER_MIN_LENGTH
  ),
  keywordMatchRatio: clampRatio(
    parseNumberEnv(
      process.env.NEXT_PUBLIC_SECTION_PARSER_KEYWORD_MATCH_RATIO,
      DEFAULT_SECTION_PARSER_KEYWORD_MATCH_RATIO
    ),
    DEFAULT_SECTION_PARSER_KEYWORD_MATCH_RATIO
  ),
};

export const isSectionContentValid = (content?: string | null): boolean => {
  if (!content) {
    return false;
  }
  return content.trim().length >= sectionParserConfig.minSectionLength;
};
