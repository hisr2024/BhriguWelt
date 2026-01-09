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

  for (let index = 0; index < lines.length; index += 1) {
    const line = lines[index];
    if (!line) {
      continue;
    }

    let hashCount = 0;
    while (hashCount < line.length && line[hashCount] === '#') {
      hashCount += 1;
    }

    if (hashCount === 0 || hashCount > 6) {
      continue;
    }

    if (line[hashCount] !== ' ') {
      continue;
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
  sections: SectionConfig[]
): Record<string, string> => {
  const result: Record<string, string> = {};
  const headings = parseMarkdownAst(markdown);

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
    const node = headings[i];
    const matchedKey = findMatchingKey(node.text);
    if (!matchedKey) {
      continue;
    }

    let endLine = lines.length;
    for (let j = i + 1; j < headings.length; j += 1) {
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
  sections: SectionConfig[]
): Record<string, string> => {
  const parsedSections: Record<string, string> = {};
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

  const lines = markdown.split('\n');
  let currentKey: string | undefined;
  let currentLines: string[] = [];

  const flushSection = () => {
    if (!currentKey) {
      currentLines = [];
      return;
    }
    const content = currentLines.join('\n').trim();
    if (content.length > 50) {
      parsedSections[currentKey] = content;
    }
    currentLines = [];
  };

  for (const line of lines) {
    if (isHeaderLine(line)) {
      flushSection();
      const headerText = stripHeaderMarkers(line);
      currentKey = headerText ? findMatchingKey(headerText) : undefined;
      continue;
    }

    if (currentKey) {
      currentLines.push(line);
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

  try {
    if (!markdown || !Array.isArray(sections)) {
      throw new Error('Invalid markdown parse request');
    }

    const extracted = extractSectionsFromAst(markdown, sections);
    if (Object.keys(extracted).length === 0) {
      throw new Error('No sections extracted from AST');
    }

    const response: WorkerResponse = {
      id,
      sections: extracted
    };

    self.postMessage(response);
  } catch (error) {
    const response: WorkerResponse = {
      id,
      sections: extractSectionsLineBased(markdown, sections),
      error: error instanceof Error ? error.message : 'Markdown parsing failed'
    };

    self.postMessage(response);
  }
};

export {};
