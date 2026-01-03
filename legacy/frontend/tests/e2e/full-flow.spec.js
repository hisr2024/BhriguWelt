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

const mockHoroscope = {
  name: 'Aarya Sen',
  karmic_epoch: 'sadhana',
  interpretation: 'The manuscripts highlight steady service paired with bold mentorship.',
  interpretation_hi: 'पांडुलिपियाँ शांत सेवा और साहसी मार्गदर्शन दर्शाती हैं।',
  rashi_chart: SIGNS.map((sign, index) => ({
    index: index + 1,
    sign,
    occupants: index === 0 ? ['Asc'] : ['—'],
    bhrigu_notes: [],
  })),
  bhava_chart: SIGNS.map((sign, index) => ({
    index: index + 1,
    sign,
    occupants: index === 1 ? ['Moon'] : ['—'],
    bhrigu_notes: [],
  })),
  dashas: [
    { lord: 'Ketu', start: '2000-01-01', end: '2007-12-30', anchor_rule: 'Anchor rule 1' },
    { lord: 'Venus', start: '2007-12-30', end: '2027-12-22', anchor_rule: 'Anchor rule 2' },
  ],
  chart: {
    metadata: {
      name: 'Aarya Sen',
      date_of_birth: '1995-05-18',
      time_of_birth: '14:45',
      place_of_birth: 'Varanasi, Bharat',
      timezone: 'Asia/Kolkata',
      calendar: {
        gregorian: '1995-05-18',
        bharat_traditional: '1995-05-18',
      },
    },
    chart: {
      ascendant: { sign: 'Aries', degree: 12 },
      houses: SIGNS.map((sign, index) => ({
        number: index + 1,
        sign,
        start_degree: index * 30,
      })),
      planets: [
        { name: 'Sun', sign: 'Leo', house: 5, degree: 12, retrograde: false },
        { name: 'Moon', sign: 'Taurus', house: 2, degree: 3, retrograde: false },
      ],
    },
  },
};

test.beforeEach(async ({ page }) => {
  await page.route('**/horoscope', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(mockHoroscope),
    });
  });

  await page.route('**/profiles', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ id: 112, user_id: 'bhrigu-user' }),
    });
  });

  await page.route('**/chat*', async (route) => {
    const method = route.request().method();
    if (method === 'POST') {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ reply: 'Your chart supports steady service and patience.' }),
      });
      return;
    }

    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ session: { transcript: [] } }),
    });
  });
});

test('horoscope flow connects form, chart, and chat', async ({ page }) => {
  await page.goto('/studio/insights');

  await page.getByLabel(/Full name/i).fill('Aarya Sen');
  await page.getByLabel(/Birth date/i).fill('1995-05-18');
  await page.getByLabel(/Birth time/i).fill('14:45');
  await page.getByLabel(/Birth place/i).fill('Varanasi, Bharat');
  await page.getByRole('button', { name: /fetch insights/i }).click();

  const results = page.getByRole('status', { name: /results/i });
  await expect(results).toContainText('Response');
  await expect(results.locator('svg.kundli-svg')).toBeVisible();

  const chatInput = page.getByPlaceholder(/Ask about the chart/i);
  if (!(await chatInput.isVisible())) {
    await page.getByRole('button', { name: /open chat/i }).click();
  }

  await chatInput.fill('How should I pace my next steps?');
  await page.getByRole('button', { name: /^send$/i }).click();
  await expect(page.getByText(/steady service and patience/i)).toBeVisible();
});
