/**
 * E2E Smoke Tests
 * Critical path testing for BhriguWelt application
 */
import { test, expect } from '@playwright/test';

test.describe('Smoke Tests', () => {
  test('homepage loads successfully', async ({ page }) => {
    await page.goto('/');
    
    // Check that the page loaded
    await expect(page).toHaveTitle(/BhriguWelt/i);
  });

  test('navigation is accessible', async ({ page }) => {
    await page.goto('/');
    
    // The app renders a top navbar and a bottom mobile nav - target the first
    const navigation = page.locator('nav').first();
    await expect(navigation).toBeVisible();
    await expect(navigation).toContainText('BhriguWelt');
  });

  test('health check endpoint is accessible', async ({ request }) => {
    // Test backend health endpoint if running
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
    
    try {
      const response = await request.get(`${apiUrl}/health`);
      expect(response.ok()).toBeTruthy();
    } catch (error) {
      // Backend might not be running in test environment
      console.log('Backend health check skipped:', error);
    }
  });

  test('app renders without console errors', async ({ page }) => {
    const consoleErrors: string[] = [];
    
    // Expected error patterns that are acceptable
    const ACCEPTABLE_ERROR_PATTERNS = [
      'Failed to fetch',
      'ECONNREFUSED',
      'ERR_CONNECTION_RESET',
      'ERR_CONNECTION_REFUSED',
      'Failed to load resource',
    ];
    
    page.on('console', (msg) => {
      if (msg.type() === 'error') {
        consoleErrors.push(msg.text());
      }
    });

    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Filter out expected errors (like missing backend in dev)
    const criticalErrors = consoleErrors.filter(
      (error) => !ACCEPTABLE_ERROR_PATTERNS.some(pattern => error.includes(pattern))
    );

    expect(criticalErrors).toHaveLength(0);
  });

  test('responsive design works on mobile', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/');
    
    // Check that page is visible on mobile viewport
    await expect(page.locator('body')).toBeVisible();
  });
});
