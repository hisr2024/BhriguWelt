const { test, expect } = require('@playwright/test');

const SIGNS = [
  'Aries',
  'Taurus',
  'Gemini',
  'Cancer',
  'Leo',
  'Virgo',
  'Libra',
  'Scorpio',
  'Sagittarius',
  'Capricorn',
  'Aquarius',
  'Pisces',
];

const mockCoreWisdom = {
  karmic_epoch: 'Bhrigu epoch: Mars mandate for steady service.',
  sections: {
    3: 'Chart overview: watery Moon and dharma placements amplify intuition.',
    4: 'Detailed analysis: strengths in intuitive dreams, remedies for grounding.',
  },
  rashi_chart: SIGNS.map((sign, index) => ({
    index: index + 1,
    sign,
    occupants: index === 3 ? ['Moon'] : index === 4 ? ['Sun'] : ['—'],
    bhrigu_notes: [],
  })),
  bhava_chart: SIGNS.map((sign, index) => ({
    index: index + 1,
    sign,
    occupants: index === 8 ? ['Jupiter'] : index === 6 ? ['Mars'] : index === 10 ? ['Saturn'] : ['—'],
    bhrigu_notes: [],
  })),
  dashas: [
    { lord: 'Ketu', start: '2000-01-01', end: '2007-12-30', anchor_rule: 'Anchor rule 1' },
    { lord: 'Venus', start: '2007-12-30', end: '2027-12-22', anchor_rule: 'Anchor rule 2' },
  ],
  remedies: [
    { id: 'REM-1', sutra_reference: 'Bikaner folio 12b', description: 'Light a copper lamp at dawn.' },
  ],
};

const mockAnalytics = {
  profiles: { total: 42, created_last_7_days: 6, updated_last_24_hours: 2 },
  sessions: { total: 18, active_last_7_days: 7, average_turns: 4.2 },
};

const mockManuscript = {
  principles: [
    {
      id: 'BR-1',
      sutra_reference: 'Bikaner folio 12b',
      description: 'Moon in watery rashi grants intuitive wisdom.',
      weights: { intuitive_dreams: 0.76, scholarly_pursuits: 0.63 },
    },
  ],
};

test.beforeEach(async ({ page }) => {
  await page.route('**/profiles/get', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        profile: {
          full_name: 'Seeker A',
          date_of_birth: '1990-05-18',
          time_of_birth: '06:20',
          place_of_birth: 'Jaipur, Bharat',
          timezone: 'Asia/Kolkata',
        },
      }),
    });
  });

  await page.route('**/core-wisdom', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(mockCoreWisdom),
    });
  });

  await page.route('**/analytics', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(mockAnalytics),
    });
  });

  await page.route('**/manuscript', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(mockManuscript),
    });
  });
});

test('analytics page renders charts and insights', async ({ page }) => {
  await page.goto('/analytics/seeker-123');

  await expect(page.getByRole('heading', { name: 'Seeker analytics' })).toBeVisible();
  await expect(page.getByText('Karmic resonance radar')).toBeVisible();
  await expect(page.getByText('Transit overlay')).toBeVisible();
  await expect(page.getByText('Aggregate principle weights')).toBeVisible();
});
