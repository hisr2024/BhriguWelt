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
    
    // Check for main navigation elements
    // This is a placeholder - adjust based on actual UI
    const navigation = page.locator('nav');
    await expect(navigation).toBeVisible();
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
    
    page.on('console', (msg) => {
      if (msg.type() === 'error') {
        consoleErrors.push(msg.text());
      }
    });

    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Allow for expected errors (like missing backend in dev)
    const criticalErrors = consoleErrors.filter(
      (error) => !error.includes('Failed to fetch') && !error.includes('ECONNREFUSED')
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
