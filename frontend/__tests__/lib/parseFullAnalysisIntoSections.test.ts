import { parseFullAnalysisIntoSections } from '@/lib/bhrigu/parseFullAnalysisIntoSections';
import { karmicJourneyResponse, relationshipResponse } from '@/__tests__/fixtures/aiResponses';

const translate = (titleKey: string) => titleKey;

describe('parseFullAnalysisIntoSections', () => {
  it('extracts sections from markdown headers', () => {
    const sections = [
      { key: 'soul_purpose', titleKey: "Soul's Primary Purpose" },
      { key: 'karmic_blueprint', titleKey: 'Karmic Blueprint' },
      { key: 'life_mission', titleKey: 'Life Mission & Dharma' },
    ];

    const result = parseFullAnalysisIntoSections(karmicJourneyResponse, sections, translate);

    expect(result.soul_purpose).toContain('cultivate leadership');
    expect(result.karmic_blueprint).toContain('Past-life patterns');
    expect(result.life_mission).toContain('This life mission blends');
  });

  it('extracts sections from bold headers', () => {
    const sections = [
      { key: 'romantic_marriage', titleKey: 'Romantic Marriage' },
    ];

    const result = parseFullAnalysisIntoSections(relationshipResponse, sections, translate);

    expect(result.romantic_marriage).toContain('mutual respect');
  });
});
