/**
 * GDPR Compliance E2E Tests
 * Tests privacy notice, consent management, and data rights
 */

import { test, expect } from '@playwright/test';

test.describe('GDPR Compliance', () => {
  test.beforeEach(async ({ page }) => {
    // Clear localStorage to ensure fresh GDPR notice
    await page.goto('/');
    await page.evaluate(() => localStorage.clear());
    await page.reload();
  });

  test('should display GDPR notice on first visit', async ({ page }) => {
    await page.goto('/');

    // Wait for GDPR notice to appear
    await expect(page.locator('text=Privacy & Data Protection')).toBeVisible({ timeout: 5000 });
    await expect(page.locator('text=GDPR compliant')).toBeVisible();
  });

  test('should show all required GDPR information', async ({ page }) => {
    await page.goto('/');

    // Check for key GDPR elements
    await expect(page.locator('text=Encrypted Storage')).toBeVisible();
    await expect(page.locator('text=Local-First')).toBeVisible();
    await expect(page.locator('text=Optional AI')).toBeVisible();
    await expect(page.locator('text=Your Rights')).toBeVisible();
  });

  test('should expand detailed information', async ({ page }) => {
    await page.goto('/');

    // Click "Show detailed information"
    await page.click('text=Show detailed information');

    // Check for expanded content
    await expect(page.locator('text=Data We Collect')).toBeVisible();
    await expect(page.locator('text=Your GDPR Rights')).toBeVisible();
    await expect(page.locator('text=Data Retention')).toBeVisible();
    await expect(page.locator('text=Third-Party Services')).toBeVisible();
  });

  test('should allow user to accept consent', async ({ page }) => {
    await page.goto('/');

    // Accept consent
    await page.click('text=I Accept & Continue');

    // Verify GDPR notice disappears
    await expect(page.locator('text=Privacy & Data Protection')).not.toBeVisible();

    // Verify consent is stored
    const consent = await page.evaluate(() => {
      const stored = localStorage.getItem('bhriguwelt_gdpr_consent');
      return stored ? JSON.parse(stored) : null;
    });

    expect(consent).toBeTruthy();
    expect(consent.accepted).toBe(true);
    expect(consent.version).toBe('1.0');
  });

  test('should allow user to decline consent', async ({ page }) => {
    await page.goto('/');

    // Decline consent
    await page.click('text=Decline & Exit');

    // Verify consent decline is stored
    const consent = await page.evaluate(() => {
      const stored = localStorage.getItem('bhriguwelt_gdpr_consent');
      return stored ? JSON.parse(stored) : null;
    });

    expect(consent).toBeTruthy();
    expect(consent.accepted).toBe(false);
  });

  test('should not show GDPR notice on subsequent visits after acceptance', async ({ page }) => {
    await page.goto('/');

    // Accept consent
    await page.click('text=I Accept & Continue');

    // Reload page
    await page.reload();

    // GDPR notice should not appear
    await expect(page.locator('text=Privacy & Data Protection')).not.toBeVisible({ timeout: 3000 });
  });

  test('should provide link to privacy documentation', async ({ page }) => {
    await page.goto('/');

    // Click to show details
    await page.click('text=Show detailed information');

    // Check for privacy guide link
    await expect(page.locator('a[href*="PRIVACY_AND_SECURITY"]')).toBeVisible();
  });

  test('should show age requirement', async ({ page }) => {
    await page.goto('/');

    // Check for age requirement
    await expect(page.locator('text=16+ years old')).toBeVisible();
  });

  test('should allow closing with X button', async ({ page }) => {
    await page.goto('/');

    // Click close button
    await page.click('[aria-label="Close GDPR notice"]');

    // Verify notice is hidden
    await expect(page.locator('text=Privacy & Data Protection')).not.toBeVisible();
  });
});

test.describe('GDPR Settings', () => {
  test.beforeEach(async ({ page }) => {
    // Accept GDPR to access settings
    await page.goto('/');
    await page.evaluate(() => {
      localStorage.setItem('bhriguwelt_gdpr_consent', JSON.stringify({
        accepted: true,
        timestamp: new Date().toISOString(),
        version: '1.0'
      }));
    });
  });

  // Note: This test assumes a Settings page exists with GDPR controls
  test.skip('should allow user to export data', async ({ page }) => {
    await page.goto('/settings');

    // Look for export button
    const exportButton = page.locator('text=Export My Data');
    if (await exportButton.isVisible()) {
      // Set up download listener
      const downloadPromise = page.waitForEvent('download');
      await exportButton.click();

      const download = await downloadPromise;
      expect(download.suggestedFilename()).toMatch(/bhriguwelt-data-.*\.json/);
    }
  });

  test.skip('should allow user to delete all data', async ({ page }) => {
    await page.goto('/settings');

    // Look for delete button
    const deleteButton = page.locator('text=Delete All Data');
    if (await deleteButton.isVisible()) {
      // Handle confirmation dialog
      page.on('dialog', dialog => dialog.accept());

      await deleteButton.click();

      // Verify data is cleared
      await page.waitForURL('/');

      const consent = await page.evaluate(() =>
        localStorage.getItem('bhriguwelt_gdpr_consent')
      );
      expect(consent).toBeNull();
    }
  });
});
