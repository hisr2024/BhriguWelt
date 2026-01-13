import { test, expect, devices } from '@playwright/test';

const mockResponse = {
  profile: {
    name: 'Demo',
    dob: '1990-01-01',
    time: '12:00',
    timezone: 'UTC',
    latitude: 0,
    longitude: 0,
    time_unknown: false,
  },
  chart: {
    datetime_utc: '1990-01-01T12:00:00+00:00',
    timezone: 'UTC',
    ascendant: { sign: 'Aries', degree: 12.3, house: 1 },
    planets: {
      sun: { sign: 'Capricorn', degree: 5.22, longitude: 275.22 },
      moon: { sign: 'Leo', degree: 2.5, longitude: 122.5 },
    },
    elements: { fire: 3, earth: 4, air: 2, water: 1 },
    nakshatra: 'Magha',
  },
  interpretation: {
    summary: 'Demo has a steady, grounded tone with bold emotional instincts.',
    sections: [
      { title: 'Career & Wealth', text: 'Career insights.', score: 0.8 },
      { title: 'Relationships', text: 'Relationship insights.', score: 0.7 },
      { title: 'Health', text: 'Health insights.', score: 0.6 },
      { title: 'Spirituality', text: 'Spiritual insights.', score: 0.9 },
    ],
    placements: {
      sun: 'Sun in Capricorn suggests focus.',
      moon: 'Moon in Leo suggests warmth.',
    },
    confidence: 0.82,
  },
  metadata: { generated_at: '2025-01-01T00:00:00Z', engine: 'pyswisseph-mock' },
};

const viewports = [
  { name: 'iPhone SE', settings: devices['iPhone SE'] },
  { name: 'iPhone 12', settings: devices['iPhone 12'] },
  { name: 'Pixel 5', settings: devices['Pixel 5'] },
];

for (const viewport of viewports) {
  test.describe(`${viewport.name} birth chart flow`, () => {
    test.use(viewport.settings);

    test('computes birth chart on mobile with slow network emulation', async ({ page, context }) => {
      if (process.env.CI) {
        await context.route('**/api/v1/birthchart/compute', async (route) => {
          await new Promise((resolve) => setTimeout(resolve, 800));
          await route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify(mockResponse),
          });
        });
      } else {
        await context.route('**/api/v1/birthchart/compute', async (route) => {
          await route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify(mockResponse),
          });
        });
      }

      await page.goto('/birthchart/new');

      await page.getByLabel('Date of birth').fill('1990-01-01');
      await page.getByRole('button', { name: 'Continue' }).click();

      await page.getByLabel('Time of birth').fill('12:00');
      await page.getByLabel('Timezone').fill('UTC');
      await page.getByRole('button', { name: 'Continue' }).click();

      await page.getByLabel('Latitude').fill('0');
      await page.getByLabel('Longitude').fill('0');

      await page.getByRole('button', { name: 'Generate Birth Chart' }).click();

      await expect(page.getByText('Your cosmic snapshot')).toBeVisible();
      await expect(page.getByText('Career & Wealth')).toBeVisible();
    });
  });
}
