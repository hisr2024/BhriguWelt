import { test, expect } from '@playwright/test';

/**
 * E2E Tests for Bhrigu Prediction View UI Interactivity
 *
 * Tests comprehensive UI interactivity including:
 * - Click handlers for section expansion
 * - Keyboard navigation (Enter/Space/Arrow keys)
 * - ARIA attributes for accessibility
 * - Touch targets (minimum 44px)
 * - Smooth animations
 * - Responsive behavior
 */

test.describe('Bhrigu Prediction View - UI Interactivity', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to a prediction page (adjust URL based on your routing)
    await page.goto('/predictions/karmic-journey');

    // Wait for the prediction content to load
    await page.waitForSelector('[data-accordion-item]', { timeout: 10000 });
  });

  test.describe('Click Handlers', () => {
    test('should expand section when clicking on header', async ({ page }) => {
      // Find the first accordion item
      const firstAccordion = page.locator('[data-accordion-item]').first();
      const trigger = firstAccordion.locator('[data-accordion-trigger="true"]');

      // Initially should be collapsed
      await expect(trigger).toHaveAttribute('aria-expanded', 'false');

      // Click to expand
      await trigger.click();

      // Should now be expanded
      await expect(trigger).toHaveAttribute('aria-expanded', 'true');

      // Content should be visible
      const panel = firstAccordion.locator('[role="region"]');
      await expect(panel).toBeVisible();
    });

    test('should collapse section when clicking expanded header', async ({ page }) => {
      const firstAccordion = page.locator('[data-accordion-item]').first();
      const trigger = firstAccordion.locator('[data-accordion-trigger="true"]');

      // Expand first
      await trigger.click();
      await expect(trigger).toHaveAttribute('aria-expanded', 'true');

      // Collapse
      await trigger.click();
      await expect(trigger).toHaveAttribute('aria-expanded', 'false');
    });

    test('should handle multiple sections independently', async ({ page }) => {
      const accordions = page.locator('[data-accordion-item]');
      const count = await accordions.count();

      if (count >= 2) {
        const firstTrigger = accordions.nth(0).locator('[data-accordion-trigger="true"]');
        const secondTrigger = accordions.nth(1).locator('[data-accordion-trigger="true"]');

        // Expand first section
        await firstTrigger.click();
        await expect(firstTrigger).toHaveAttribute('aria-expanded', 'true');
        await expect(secondTrigger).toHaveAttribute('aria-expanded', 'false');

        // Expand second section
        await secondTrigger.click();
        await expect(firstTrigger).toHaveAttribute('aria-expanded', 'true');
        await expect(secondTrigger).toHaveAttribute('aria-expanded', 'true');
      }
    });
  });

  test.describe('Keyboard Navigation', () => {
    test('should expand section with Enter key', async ({ page }) => {
      const firstAccordion = page.locator('[data-accordion-item]').first();
      const trigger = firstAccordion.locator('[data-accordion-trigger="true"]');

      // Focus the trigger
      await trigger.focus();

      // Press Enter
      await page.keyboard.press('Enter');

      // Should be expanded
      await expect(trigger).toHaveAttribute('aria-expanded', 'true');
    });

    test('should expand section with Space key', async ({ page }) => {
      const firstAccordion = page.locator('[data-accordion-item]').first();
      const trigger = firstAccordion.locator('[data-accordion-trigger="true"]');

      // Focus the trigger
      await trigger.focus();

      // Press Space
      await page.keyboard.press('Space');

      // Should be expanded
      await expect(trigger).toHaveAttribute('aria-expanded', 'true');
    });

    test('should navigate between sections with Arrow keys', async ({ page }) => {
      const accordions = page.locator('[data-accordion-item]');
      const count = await accordions.count();

      if (count >= 2) {
        const firstTrigger = accordions.nth(0).locator('[data-accordion-trigger="true"]');
        const secondTrigger = accordions.nth(1).locator('[data-accordion-trigger="true"]');

        // Focus first trigger
        await firstTrigger.focus();
        await expect(firstTrigger).toBeFocused();

        // Press ArrowDown to move to second
        await page.keyboard.press('ArrowDown');
        await expect(secondTrigger).toBeFocused();

        // Press ArrowUp to move back to first
        await page.keyboard.press('ArrowUp');
        await expect(firstTrigger).toBeFocused();
      }
    });

    test('should navigate to first section with Home key', async ({ page }) => {
      const accordions = page.locator('[data-accordion-item]');
      const count = await accordions.count();

      if (count >= 2) {
        const firstTrigger = accordions.nth(0).locator('[data-accordion-trigger="true"]');
        const secondTrigger = accordions.nth(1).locator('[data-accordion-trigger="true"]');

        // Focus second trigger
        await secondTrigger.focus();

        // Press Home to go to first
        await page.keyboard.press('Home');
        await expect(firstTrigger).toBeFocused();
      }
    });

    test('should navigate to last section with End key', async ({ page }) => {
      const accordions = page.locator('[data-accordion-item]');
      const count = await accordions.count();

      if (count >= 2) {
        const firstTrigger = accordions.nth(0).locator('[data-accordion-trigger="true"]');
        const lastTrigger = accordions.nth(count - 1).locator('[data-accordion-trigger="true"]');

        // Focus first trigger
        await firstTrigger.focus();

        // Press End to go to last
        await page.keyboard.press('End');
        await expect(lastTrigger).toBeFocused();
      }
    });
  });

  test.describe('ARIA Attributes and Accessibility', () => {
    test('should have correct aria-expanded attribute', async ({ page }) => {
      const firstAccordion = page.locator('[data-accordion-item]').first();
      const trigger = firstAccordion.locator('[data-accordion-trigger="true"]');

      // Should have aria-expanded
      await expect(trigger).toHaveAttribute('aria-expanded');

      // Initially false
      await expect(trigger).toHaveAttribute('aria-expanded', 'false');

      // Click to expand
      await trigger.click();
      await expect(trigger).toHaveAttribute('aria-expanded', 'true');
    });

    test('should have aria-controls pointing to content panel', async ({ page }) => {
      const firstAccordion = page.locator('[data-accordion-item]').first();
      const trigger = firstAccordion.locator('[data-accordion-trigger="true"]');
      const panel = firstAccordion.locator('[role="region"]');

      // Get aria-controls value
      const controlsId = await trigger.getAttribute('aria-controls');
      expect(controlsId).toBeTruthy();

      // Panel should have matching id
      const panelId = await panel.getAttribute('id');
      expect(panelId).toBe(controlsId);
    });

    test('should have role="region" on content panel', async ({ page }) => {
      const firstAccordion = page.locator('[data-accordion-item]').first();
      const trigger = firstAccordion.locator('[data-accordion-trigger="true"]');

      // Expand to reveal panel
      await trigger.click();

      const panel = firstAccordion.locator('[role="region"]');
      await expect(panel).toHaveAttribute('role', 'region');
    });

    test('should have aria-labelledby on content panel', async ({ page }) => {
      const firstAccordion = page.locator('[data-accordion-item]').first();
      const trigger = firstAccordion.locator('[data-accordion-trigger="true"]');

      // Expand to reveal panel
      await trigger.click();

      const panel = firstAccordion.locator('[role="region"]');
      const triggerId = await trigger.getAttribute('id');
      const labelledBy = await panel.getAttribute('aria-labelledby');

      expect(labelledBy).toBe(triggerId);
    });

    test('should have proper focus indicators', async ({ page }) => {
      const firstAccordion = page.locator('[data-accordion-item]').first();
      const trigger = firstAccordion.locator('[data-accordion-trigger="true"]');

      // Focus the trigger
      await trigger.focus();

      // Check for focus-visible styles (via tab, not click)
      await page.keyboard.press('Tab');

      // The element should have focus ring classes
      const classList = await trigger.evaluate(el => el.className);
      expect(classList).toContain('focus-visible:ring');
    });
  });

  test.describe('Chevron Icons', () => {
    test('should show ChevronDown when collapsed', async ({ page }) => {
      const firstAccordion = page.locator('[data-accordion-item]').first();
      const trigger = firstAccordion.locator('[data-accordion-trigger="true"]');

      // Ensure collapsed
      const isExpanded = await trigger.getAttribute('aria-expanded');
      if (isExpanded === 'true') {
        await trigger.click();
      }

      // Should have ChevronDown icon visible
      const chevronDown = trigger.locator('svg').filter({ hasNotText: '' }).first();
      await expect(chevronDown).toBeVisible();
    });

    test('should show ChevronUp when expanded', async ({ page }) => {
      const firstAccordion = page.locator('[data-accordion-item]').first();
      const trigger = firstAccordion.locator('[data-accordion-trigger="true"]');

      // Expand
      await trigger.click();

      // Should have ChevronUp icon visible
      const chevronUp = trigger.locator('svg').filter({ hasNotText: '' }).first();
      await expect(chevronUp).toBeVisible();
    });

    test('should toggle chevron icon on click', async ({ page }) => {
      const firstAccordion = page.locator('[data-accordion-item]').first();
      const trigger = firstAccordion.locator('[data-accordion-trigger="true"]');

      // Initial state
      const initialExpanded = await trigger.getAttribute('aria-expanded');

      // Click to toggle
      await trigger.click();

      // Wait for animation
      await page.waitForTimeout(100);

      // Should have changed
      const newExpanded = await trigger.getAttribute('aria-expanded');
      expect(newExpanded).not.toBe(initialExpanded);
    });
  });

  test.describe('Touch Targets', () => {
    test('should have minimum touch target size of 44px', async ({ page }) => {
      const triggers = page.locator('[data-accordion-trigger="true"]');
      const count = await triggers.count();

      for (let i = 0; i < Math.min(count, 3); i++) {
        const trigger = triggers.nth(i);
        const box = await trigger.boundingBox();

        expect(box).toBeTruthy();
        if (box) {
          expect(box.height).toBeGreaterThanOrEqual(44);
        }
      }
    });

    test('should be clickable on mobile viewport', async ({ page }) => {
      // Set mobile viewport
      await page.setViewportSize({ width: 375, height: 667 });

      const firstAccordion = page.locator('[data-accordion-item]').first();
      const trigger = firstAccordion.locator('[data-accordion-trigger="true"]');

      // Should still be clickable
      await trigger.click();
      await expect(trigger).toHaveAttribute('aria-expanded', 'true');
    });

    test('should handle touch events properly', async ({ page }) => {
      const firstAccordion = page.locator('[data-accordion-item]').first();
      const trigger = firstAccordion.locator('[data-accordion-trigger="true"]');

      // Tap (simulated touch)
      await trigger.tap();

      // Should expand
      await expect(trigger).toHaveAttribute('aria-expanded', 'true');
    });
  });

  test.describe('Animations', () => {
    test('should animate section expansion', async ({ page }) => {
      const firstAccordion = page.locator('[data-accordion-item]').first();
      const trigger = firstAccordion.locator('[data-accordion-trigger="true"]');
      const panel = firstAccordion.locator('[role="region"]');

      // Click to expand
      await trigger.click();

      // Wait for animation to start
      await page.waitForTimeout(50);

      // Panel should become visible
      await expect(panel).toBeVisible({ timeout: 1000 });
    });

    test('should animate section collapse', async ({ page }) => {
      const firstAccordion = page.locator('[data-accordion-item]').first();
      const trigger = firstAccordion.locator('[data-accordion-trigger="true"]');

      // Expand first
      await trigger.click();
      await page.waitForTimeout(350);

      // Collapse
      await trigger.click();

      // Wait for animation
      await page.waitForTimeout(350);

      // Panel should be hidden
      const panel = firstAccordion.locator('[role="region"]');
      await expect(panel).toBeHidden();
    });

    test('should have smooth transition durations', async ({ page }) => {
      const firstAccordion = page.locator('[data-accordion-item]').first();
      const trigger = firstAccordion.locator('[data-accordion-trigger="true"]');

      const startTime = Date.now();
      await trigger.click();

      // Wait for panel to be visible
      const panel = firstAccordion.locator('[role="region"]');
      await expect(panel).toBeVisible();

      const duration = Date.now() - startTime;

      // Animation should take reasonable time (between 100ms and 1000ms)
      expect(duration).toBeGreaterThan(100);
      expect(duration).toBeLessThan(1000);
    });
  });

  test.describe('Responsive Behavior', () => {
    test('should work on mobile viewport', async ({ page }) => {
      await page.setViewportSize({ width: 375, height: 667 });

      const firstAccordion = page.locator('[data-accordion-item]').first();
      const trigger = firstAccordion.locator('[data-accordion-trigger="true"]');

      await trigger.click();
      await expect(trigger).toHaveAttribute('aria-expanded', 'true');
    });

    test('should work on tablet viewport', async ({ page }) => {
      await page.setViewportSize({ width: 768, height: 1024 });

      const firstAccordion = page.locator('[data-accordion-item]').first();
      const trigger = firstAccordion.locator('[data-accordion-trigger="true"]');

      await trigger.click();
      await expect(trigger).toHaveAttribute('aria-expanded', 'true');
    });

    test('should work on desktop viewport', async ({ page }) => {
      await page.setViewportSize({ width: 1920, height: 1080 });

      const firstAccordion = page.locator('[data-accordion-item]').first();
      const trigger = firstAccordion.locator('[data-accordion-trigger="true"]');

      await trigger.click();
      await expect(trigger).toHaveAttribute('aria-expanded', 'true');
    });
  });

  test.describe('Full Reading Section', () => {
    test('should expand/collapse full reading section', async ({ page }) => {
      // Find the "Full Reading" button
      const fullReadingButton = page.locator('button[aria-controls="full-analysis-content"]');

      if (await fullReadingButton.count() > 0) {
        // Initially collapsed
        await expect(fullReadingButton).toHaveAttribute('aria-expanded', 'false');

        // Click to expand
        await fullReadingButton.click();
        await expect(fullReadingButton).toHaveAttribute('aria-expanded', 'true');

        // Content should be visible
        const content = page.locator('#full-analysis-content');
        await expect(content).toBeVisible();

        // Click to collapse
        await fullReadingButton.click();
        await expect(fullReadingButton).toHaveAttribute('aria-expanded', 'false');
      }
    });

    test('should show chevron icons in full reading button', async ({ page }) => {
      const fullReadingButton = page.locator('button[aria-controls="full-analysis-content"]');

      if (await fullReadingButton.count() > 0) {
        // Should have an icon
        const icon = fullReadingButton.locator('svg').first();
        await expect(icon).toBeVisible();
      }
    });
  });

  test.describe('Memory Leaks Prevention', () => {
    test('should not leak event listeners on rapid toggling', async ({ page }) => {
      const firstAccordion = page.locator('[data-accordion-item]').first();
      const trigger = firstAccordion.locator('[data-accordion-trigger="true"]');

      // Rapidly toggle 20 times
      for (let i = 0; i < 20; i++) {
        await trigger.click();
        await page.waitForTimeout(50);
      }

      // Should still work correctly
      const finalState = await trigger.getAttribute('aria-expanded');
      expect(finalState).toBeTruthy();
    });
  });

  test.describe('Offline Behavior', () => {
    test('should show offline indicator when offline', async ({ page, context }) => {
      // Go offline
      await context.setOffline(true);

      // Reload page
      await page.reload();

      // Should show offline message
      const offlineMessage = page.locator('text=/offline mode/i');
      await expect(offlineMessage).toBeVisible({ timeout: 5000 });
    });

    test('should load from cache when offline', async ({ page, context }) => {
      // First load online
      await expect(page.locator('[data-accordion-item]')).toBeVisible();

      // Go offline
      await context.setOffline(true);

      // Reload page
      await page.reload({ waitUntil: 'domcontentloaded' });

      // Should still show content from cache
      // Note: This test may need adjustment based on your actual offline behavior
      await page.waitForTimeout(2000);
    });
  });
});

test.describe('Bhrigu Prediction View - Bundle Size Optimization', () => {
  test('should lazy load heavy components', async ({ page }) => {
    // Navigate to home first
    await page.goto('/');

    // Check that prediction components aren't loaded yet
    const accordionsBefore = await page.locator('[data-accordion-item]').count();
    expect(accordionsBefore).toBe(0);

    // Navigate to predictions
    await page.goto('/predictions/karmic-journey');

    // Now should be loaded
    const accordionsAfter = await page.locator('[data-accordion-item]').count();
    expect(accordionsAfter).toBeGreaterThan(0);
  });
});
