export type SectionConfig = {
  key: string;
  titleKey: string;
};

type TitleTranslator = (titleKey: string, locale?: string) => string;

export const parseFullAnalysisIntoSections = (
  fullAnalysis: string,
  sections: SectionConfig[],
  translateTitle: TitleTranslator
): Record<string, string> => {
  const parsedSections: Record<string, string> = {};

  if (!fullAnalysis) return parsedSections;

  for (const section of sections) {
    const sectionTitle = translateTitle(section.titleKey, 'en');
    const escapedTitle = sectionTitle.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

    const patterns = [
      new RegExp(`##\\s*(?:\\d+\\.? \\s*)?${escapedTitle}[:\\s]*([\\s\\S]*?)(?=\\n##|$)`, 'i'),
      new RegExp(`\\n\\d+\\.\\s*${escapedTitle}[:\\s]*([\\s\\S]*?)(?=\\n\\d+\\.|\\n##|$)`, 'i'),
      new RegExp(`\\*\\*${escapedTitle}\\*\\*[:\\s]*([\\s\\S]*?)(?=\\n\\*\\*|\\n##|$)`, 'i'),
      new RegExp(`${escapedTitle}:\\s*([\\s\\S]*?)(?=\\n[A-Z][a-z]+:|\\n##|\\n\\d+\\.|$)`, 'i'),
    ];

    for (const pattern of patterns) {
      try {
        const match = fullAnalysis.match(pattern);
        if (match && (match[1]?.trim().length ?? 0) > 50) {
          parsedSections[section.key] = (match[1] ?? '').trim();
          break;
        }
      } catch (e) {
        continue;
      }
    }
  }

  return parsedSections;
};
