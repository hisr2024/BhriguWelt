import type { ChartData } from '@/lib/api/predictions';
import { generateRelationshipsPrediction } from '@/lib/engines/relationshipsEngine';

describe('relationshipsEngine', () => {
  it('generates relationship traits with validation notes from sample data', async () => {
    const sampleChart: ChartData = {
      date_of_birth: '1990-01-01',
      time_of_birth: '10:00',
      place_of_birth: 'Delhi, India',
      ascendant: 'Libra',
      moon_sign: 'Taurus',
      zodiac_sign: 'Capricorn',
      planets: {
        Venus: { sign: 'Aries', longitude: 10 },
        Moon: { sign: 'Taurus', longitude: 15 },
        Mars: { sign: 'Aries', longitude: 5 },
        Jupiter: { sign: 'Aries', longitude: 20 },
        Rahu: { sign: 'Libra', longitude: 3 },
        Ketu: { sign: 'Aries', longitude: 3 },
      },
    };

    const result = await generateRelationshipsPrediction(sampleChart, {
      mode: 'offline',
      useAI: false,
    });

    expect(result.subcategories.overview.content).toMatch(/7th house/i);
    expect(result.subcategories.validation.content).toMatch(/Ascendant verified/i);
  });
});
