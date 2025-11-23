const { test, expect } = require('@playwright/test');

const mockChart = {
  interpretation: 'You are guided by the manuscripts to serve quietly.',
  interpretation_hi: 'आप शांत सेवा से मार्गदर्शित हैं।',
  karmic_epoch: 'sadhana',
  chart: { planets: [], houses: [], ascendant: 1 },
};

test.beforeEach(async ({ page }) => {
  await page.route('**/api/chart', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(mockChart),
    });
  });
});

test('horoscope submission renders bilingual reading actions', async ({ page }) => {
  await page.goto('/horoscope');

  await page.getByLabel(/Full name/i).fill('Aarya Sen');
  await page.getByLabel(/Date of birth/i).fill('1995-05-18');
  await page.getByLabel(/Time of birth/i).fill('14:45');
  await page.getByLabel(/Place of birth/i).fill('Varanasi');
  await page.getByRole('button', { name: /generate reading/i }).click();

  await expect(page.getByRole('status')).toContainText('Reading captured');
  await expect(page.getByRole('button', { name: /Ask in chat/i })).toBeVisible();
  await expect(page.getByRole('button', { name: /Download PDF|Save PDF/i })).toBeVisible();
  await expect(page.getByText(/Interpretation/i)).toBeVisible();
  await expect(page.getByText(/आप शांत सेवा/)).toBeVisible();
});

test('kundli charts stay square on mobile screens', async ({ page }) => {
  await page.setViewportSize({ width: 414, height: 896 });
  await page.goto('/');

  const chart = page.locator('svg.kundli-svg').first();
  await expect(chart).toBeVisible();
  const box = await chart.boundingBox();
  expect(box).not.toBeNull();
  if (!box) return;
  const aspectRatio = box.width / box.height;
  expect(aspectRatio).toBeGreaterThan(0.9);
  expect(aspectRatio).toBeLessThan(1.1);
});
