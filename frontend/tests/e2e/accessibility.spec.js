const { test, expect } = require('@playwright/test');

// Lightweight WCAG-inspired smoke checks to mirror screen reader paths.
test('skip link focuses main content for screen readers', async ({ page }) => {
  await page.goto('/');

  const skipLink = page.getByRole('link', { name: /skip to content/i });
  await skipLink.focus();
  await page.keyboard.press('Enter');

  await expect(page.locator('main#main')).toBeFocused();
});

test('navigation landmarks and toggles announce their labels', async ({ page }) => {
  await page.goto('/');

  await expect(page.getByRole('navigation', { name: /main/i })).toBeVisible();
  await expect(page.getByLabel(/Language toggle/i)).toBeVisible();
  await expect(page.getByRole('link', { name: /skip to content/i })).toBeVisible();
});
