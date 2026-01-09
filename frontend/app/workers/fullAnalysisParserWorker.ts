import { getEnglishSectionTitles } from '@/lib/bhriguSections';

type WorkerRequest = {
  id: number;
  fullAnalysis: string;
  category: string;
};

type WorkerResponse = {
  id: number;
  sections: Record<string, string>;
  error?: string;
  fromCache?: boolean;
};

type SectionConfig = {
  key: string;
  title: string;
};

type HeadingNode = {
  type: 'heading';
  depth: number;
  text: string;
  start: number;
  end: number;
};

const parseCache = new Map<string, Record<string, string>>();

const hashString = (value: string): string => {
  let hash = 5381;
  for (let i = 0; i < value.length; i += 1) {
    hash = (hash * 33) ^ value.charCodeAt(i);
  }
  return (hash >>> 0).toString(16);
};

const buildCacheKey = (category: string, fullAnalysis: string): string => {
  return `${category}:${fullAnalysis.length}:${hashString(fullAnalysis)}`;
};

const normalizeHeading = (value: string): string => {
  return value
    .toLowerCase()
    .replace(/[’'"`]/g, '')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();
};

const parseMarkdownAst = (markdown: string): HeadingNode[] => {
  const lines = markdown.split('\n');
  const headings: HeadingNode[] = [];
  let offset = 0;

  for (const line of lines) {
    const match = line.match(/^(#{1,6})\s+(.*)$/);
    if (match) {
      const depth = match[1].length;
      const text = match[2].trim();
      headings.push({
        type: 'heading',
        depth,
        text,
        start: offset,
        end: offset + line.length
      });
    }
    offset += line.length + 1;
  }

  return headings;
};

const extractSectionsFromAst = (markdown: string, sections: SectionConfig[]): Record<string, string> => {
  const result: Record<string, string> = {};
  const headings = parseMarkdownAst(markdown);

  if (headings.length === 0) {
    throw new Error('No headings parsed from markdown');
  }

  const normalizedTitles = new Map<string, string>();
  for (const section of sections) {
    normalizedTitles.set(normalizeHeading(section.title), section.key);
  }

  const findMatchingKey = (headingText: string): string | undefined => {
    const normalizedHeading = normalizeHeading(headingText);
    if (normalizedTitles.has(normalizedHeading)) {
      return normalizedTitles.get(normalizedHeading);
    }

    for (const [normalizedTitle, key] of normalizedTitles.entries()) {
      if (normalizedHeading.includes(normalizedTitle) || normalizedTitle.includes(normalizedHeading)) {
        return key;
      }
    }
    return undefined;
  };

  for (let i = 0; i < headings.length; i += 1) {
    const node = headings[i];
    const matchedKey = findMatchingKey(node.text);
    if (!matchedKey) {
      continue;
    }

    let endOffset = markdown.length;
    for (let j = i + 1; j < headings.length; j += 1) {
      const nextNode = headings[j];
      if (nextNode.depth <= node.depth) {
        endOffset = nextNode.start;
        break;
      }
    }

    const content = markdown.slice(node.end, endOffset).trim();
    if (content) {
      result[matchedKey] = content;
    }
  }

  return result;
};

const extractSectionsWithRegex = (markdown: string, sections: SectionConfig[]): Record<string, string> => {
  const parsedSections: Record<string, string> = {};

  for (const section of sections) {
    const escapedTitle = section.title.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const patterns = [
      new RegExp(`##\\s*(?:\\d+\\.?\\s*)?${escapedTitle}[:\\s]*([\\s\\S]*?)(?=\\n##|$)`, 'i'),
      new RegExp(`\\n\\d+\\.\\s*${escapedTitle}[:\\s]*([\\s\\S]*?)(?=\\n\\d+\\.|\\n##|$)`, 'i'),
      new RegExp(`\\*\\*${escapedTitle}\\*\\*[:\\s]*([\\s\\S]*?)(?=\\n\\*\\*|\\n##|$)`, 'i'),
      new RegExp(`${escapedTitle}:\\s*([\\s\\S]*?)(?=\\n[A-Z][a-z]+:|\\n##|\\n\\d+\\.|$)`, 'i')
    ];

    for (const pattern of patterns) {
      const match = markdown.match(pattern);
      if (match && match[1]?.trim().length > 50) {
        parsedSections[section.key] = match[1].trim();
        break;
      }
    }
  }

  return parsedSections;
};

self.onmessage = (event: MessageEvent<WorkerRequest>) => {
  const payload = event.data;

  if (!payload) {
    return;
  }

  const { id, fullAnalysis, category } = payload;

  try {
    if (!fullAnalysis || typeof category !== 'string') {
      throw new Error('Invalid analysis parse request');
    }

    const cacheKey = buildCacheKey(category, fullAnalysis);
    const cached = parseCache.get(cacheKey);
    if (cached) {
      const response: WorkerResponse = {
        id,
        sections: cached,
        fromCache: true
      };
      self.postMessage(response);
      return;
    }

    const sections = getEnglishSectionTitles(category);
    const extracted = extractSectionsFromAst(fullAnalysis, sections);
    if (Object.keys(extracted).length === 0) {
      throw new Error('No sections extracted from AST');
    }

    parseCache.set(cacheKey, extracted);

    const response: WorkerResponse = {
      id,
      sections: extracted
    };

    self.postMessage(response);
  } catch (error) {
    const fallbackSections = getEnglishSectionTitles(category);
    const extracted = extractSectionsWithRegex(fullAnalysis, fallbackSections);
    if (Object.keys(extracted).length > 0) {
      parseCache.set(buildCacheKey(category, fullAnalysis), extracted);
    }

    const response: WorkerResponse = {
      id,
      sections: extracted,
      error: error instanceof Error ? error.message : 'Analysis parsing failed'
    };

    self.postMessage(response);
  }
};

export {};
