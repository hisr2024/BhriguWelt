const { test, expect } = require('@playwright/test');

// Ensures onboarding, glossary, and accessibility toggles are discoverable.
test('onboarding tour shows glossary and assists beginners', async ({ page }) => {
  await page.goto('/');

  const dialog = page.getByRole('dialog', { name: /onboarding journey/i });
  await expect(dialog).toBeVisible();

  await page.getByLabel(/Voice guidance/i).check();
  await page.getByLabel(/Haptic nudges/i).check();
  await page.getByText(/Glossary/).click();
  await expect(page.getByText(/Tithi/)).toBeVisible();

  await page.getByRole('button', { name: /Next/i }).click();
  await page.getByRole('button', { name: /Next/i }).click();
  await page.getByRole('button', { name: /Start exploring/i }).click();

  await expect(dialog).toBeHidden();
});
