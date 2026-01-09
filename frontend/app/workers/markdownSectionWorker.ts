type SectionConfig = {
  key: string;
  titles: string[];
};

type WorkerRequest = {
  id: number;
  markdown: string;
  sections: SectionConfig[];
};

type WorkerResponse = {
  id: number;
  sections: Record<string, string>;
  error?: string;
};

type HeadingNode = {
  type: 'heading';
  depth: number;
  text: string;
  lineIndex: number;
};

const MAX_MARKDOWN_LENGTH = 200_000;
const PARSE_TIME_BUDGET_MS = 200;

const now = (): number => {
  return typeof performance !== 'undefined' ? performance.now() : Date.now();
};

const createTimeGuard = (startTime: number) => {
  return () => {
    if (now() - startTime > PARSE_TIME_BUDGET_MS) {
      throw new Error('Markdown parsing time budget exceeded');
    }
  };
};

const normalizeHeading = (value: string): string => {
  return value
    .toLowerCase()
    .replace(/[’'"`]/g, '')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();
};

const parseMarkdownAst = (markdown: string, checkTime: () => void): HeadingNode[] => {
  const lines = markdown.split('\n');
  const headings: HeadingNode[] = [];

  for (const line of lines) {
    checkTime();
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

    const text = line.slice(hashCount).trim();
    if (!text) {
      continue;
    }

    headings.push({
      type: 'heading',
      depth: hashCount,
      text,
      lineIndex: index
    });
  }

  return headings;
};

const extractSectionsFromAst = (
  markdown: string,
  sections: SectionConfig[],
  checkTime: () => void
): Record<string, string> => {
  const result: Record<string, string> = {};
  const headings = parseMarkdownAst(markdown, checkTime);

  if (headings.length === 0) {
    throw new Error('No headings parsed from markdown');
  }

  const normalizedTitles = new Map<string, string>();

  for (const section of sections) {
    for (const title of section.titles) {
      if (!title) continue;
      normalizedTitles.set(normalizeHeading(title), section.key);
    }
  }

  const findMatchingKey = (headingText: string): string | undefined => {
    checkTime();
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

  const lines = markdown.split('\n');

  for (let i = 0; i < headings.length; i += 1) {
    checkTime();
    const node = headings[i];
    const matchedKey = findMatchingKey(node.text);
    if (!matchedKey) {
      continue;
    }
    if (result[matchedKey]) {
      continue;
    }

    let endLine = lines.length;
    for (let j = i + 1; j < headings.length; j += 1) {
      checkTime();
      const nextNode = headings[j];
      if (nextNode.depth <= node.depth) {
        endLine = nextNode.lineIndex;
        break;
      }
    }

    const content = lines.slice(node.lineIndex + 1, endLine).join('\n').trim();
    if (content) {
      result[matchedKey] = content;
    }

    if (Object.keys(result).length === sections.length) {
      break;
    }
  }

  return result;
};

const isNumberedHeader = (line: string): boolean => {
  let index = 0;
  while (index < line.length && line[index] >= '0' && line[index] <= '9') {
    index += 1;
  }
  if (index === 0) {
    return false;
  }
  const nextChar = line[index];
  return nextChar === '.' || nextChar === ')';
};

const stripHeaderMarkers = (line: string): string => {
  let cleaned = line.trim();

  while (cleaned.startsWith('#')) {
    cleaned = cleaned.slice(1).trim();
  }

  if (cleaned.startsWith('**') && cleaned.endsWith('**') && cleaned.length > 4) {
    cleaned = cleaned.slice(2, cleaned.length - 2).trim();
  }

  if (isNumberedHeader(cleaned)) {
    let index = 0;
    while (index < cleaned.length && cleaned[index] >= '0' && cleaned[index] <= '9') {
      index += 1;
    }
    if (cleaned[index] === '.' || cleaned[index] === ')') {
      cleaned = cleaned.slice(index + 1).trim();
    }
  }

  if (cleaned.endsWith(':')) {
    cleaned = cleaned.slice(0, -1).trim();
  }

  return cleaned;
};

const isHeaderLine = (line: string): boolean => {
  const trimmed = line.trim();
  if (!trimmed) {
    return false;
  }
  if (trimmed.startsWith('#')) {
    return true;
  }
  if (trimmed.startsWith('**') && trimmed.endsWith('**') && trimmed.length > 4) {
    return true;
  }
  if (isNumberedHeader(trimmed)) {
    return true;
  }
  if (trimmed.endsWith(':')) {
    const wordCount = trimmed.split(' ').filter(Boolean).length;
    return wordCount <= 6;
  }
  return false;
};

const extractSectionsLineBased = (
  markdown: string,
  sections: SectionConfig[],
  checkTime: () => void
): Record<string, string> => {
  const parsedSections: Record<string, string> = {};
  const normalizedTitles = new Map<string, string>();

  for (const section of sections) {
    checkTime();
    const escapedTitle = section.title.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const patterns = [
      new RegExp(`##\\s*(?:\\d+\\.?\\s*)?${escapedTitle}[:\\s]*([\\s\\S]*?)(?=\\n##|$)`, 'i'),
      new RegExp(`\\n\\d+\\.\\s*${escapedTitle}[:\\s]*([\\s\\S]*?)(?=\\n\\d+\\.|\\n##|$)`, 'i'),
      new RegExp(`\\*\\*${escapedTitle}\\*\\*[:\\s]*([\\s\\S]*?)(?=\\n\\*\\*|\\n##|$)`, 'i'),
      new RegExp(`${escapedTitle}:\\s*([\\s\\S]*?)(?=\\n[A-Z][a-z]+:|\\n##|\\n\\d+\\.|$)`, 'i')
    ];

    for (const pattern of patterns) {
      checkTime();
      const match = markdown.match(pattern);
      if (match && match[1]?.trim().length > 50) {
        parsedSections[section.key] = match[1].trim();
        break;
      }
    }

    if (Object.keys(parsedSections).length === sections.length) {
      break;
    }
  }

  flushSection();
  return parsedSections;
};

self.onmessage = (event: MessageEvent<WorkerRequest>) => {
  const payload = event.data;

  if (!payload) {
    return;
  }

  const { id, markdown, sections } = payload;
  const startTime = now();
  const checkTime = createTimeGuard(startTime);
  const rawMarkdown = typeof markdown === 'string' ? markdown : '';
  const safeMarkdown =
    rawMarkdown.length > MAX_MARKDOWN_LENGTH
      ? rawMarkdown.slice(0, MAX_MARKDOWN_LENGTH)
      : rawMarkdown;

  try {
    if (!rawMarkdown || !Array.isArray(sections)) {
      throw new Error('Invalid markdown parse request');
    }

    const extracted = extractSectionsFromAst(safeMarkdown, sections, checkTime);
    if (Object.keys(extracted).length === 0) {
      throw new Error('No sections extracted from AST');
    }

    const response: WorkerResponse = {
      id,
      sections: extracted
    };

    self.postMessage(response);
  } catch (error) {
    let fallbackSections: Record<string, string> = {};
    let errorMessage = error instanceof Error ? error.message : 'Markdown parsing failed';

    try {
      fallbackSections = extractSectionsWithRegex(safeMarkdown, sections, checkTime);
    } catch (fallbackError) {
      if (fallbackError instanceof Error) {
        errorMessage = fallbackError.message;
      }
    }

    const response: WorkerResponse = {
      id,
      sections: fallbackSections,
      error: errorMessage
    };

    self.postMessage(response);
  }
};

export {};
