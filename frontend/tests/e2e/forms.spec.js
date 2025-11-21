// E2E smoke test for the horoscope form. Requires @playwright/test.
const { test, expect } = require('@playwright/test');

const mockHoroscope = {
  name: 'Asha',
  karmic_epoch: 'sadhana',
  interpretation: 'The folios say Asha leads with gentle service and steadfast study.',
  interpretation_hi: 'पांडुलिपि बताती है कि आशा सेवा और अध्ययन में स्थिर है।',
  principles: [{ title: 'Dharma', detail: 'Stay aligned with Bhrigu counsel.' }],
  remedies: [{ title: 'Mantra', detail: 'Chant with devotion.' }],
  past_life_insights: [{ title: 'Past', detail: 'Seeker has served in prior era.' }],
  future_trajectories: [{ title: 'Future', detail: 'Opportunity to teach.' }],
};

test.beforeEach(async ({ page }) => {
  await page.route('**/horoscope', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(mockHoroscope),
    });
  });
});

test('horoscope form submits and renders narrative payload', async ({ page }) => {
  await page.goto('/horoscope');

  await page.getByLabel(/Full name/i).fill('Asha');
  await page.getByLabel(/Birth date/i).fill('1995-05-18');
  await page.getByLabel(/Birth time/i).fill('14:45');
  await page.getByLabel(/Birth place/i).fill('Varanasi');
  await page.getByLabel(/Lunar tithi/i).fill('5');
  await page.getByLabel(/Mars house/i).fill('10');
  await page.getByLabel(/Saturn house/i).fill('2');
  await page.getByLabel(/Venus house/i).fill('2');
  await page.getByLabel(/Rahu aspects/i).selectOption('yes');

  await page.getByRole('button', { name: /fetch|insights|consulting/i }).click();

  await expect(page.getByRole('status')).toContainText('Asha');
  await expect(page.getByRole('status')).toContainText('sadhana');
});
