const { test, expect } = require('@playwright/test');

test.describe('responsive navigation', () => {
  test.use({ viewport: { width: 375, height: 812 } });

  test('mobile menu reveals primary links', async ({ page }) => {
    await page.goto('/');

    const menuButton = page.getByRole('button', { name: /menu/i });
    await expect(menuButton).toBeVisible();

    await menuButton.click();

    await expect(page.getByRole('link', { name: /dashboard/i })).toBeVisible();
    await expect(page.getByRole('link', { name: /calendar/i })).toBeVisible();
  });
});
