/**
 * Browser matrix coverage tests
 */
import { test, expect } from '@playwright/test';

test.describe('Browser matrix coverage', () => {
  test('homepage renders across projects', async ({ page }) => {
    await page.goto('/');

    const userAgent = await page.evaluate(() => navigator.userAgent);
    expect(userAgent).toBeTruthy();

    await expect(page.locator('body')).toBeVisible();
  });
});
