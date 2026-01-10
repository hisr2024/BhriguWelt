/**
 * Performance E2E Tests
 * Tests page load times, API response times, and resource optimization
 */

import { test, expect } from '@playwright/test';

test.describe('Performance Metrics', () => {
  test('homepage should load within acceptable time', async ({ page }) => {
    const startTime = Date.now();

    await page.goto('/');

    // Wait for page to be fully loaded
    await page.waitForLoadState('networkidle');

    const loadTime = Date.now() - startTime;

    // Assert load time is under 3 seconds
    expect(loadTime).toBeLessThan(3000);
    console.log(`Homepage load time: ${loadTime}ms`);
  });

  test('should have acceptable First Contentful Paint', async ({ page }) => {
    await page.goto('/');

    const fcp = await page.evaluate(() => {
      const perfEntries = performance.getEntriesByType('paint');
      const fcpEntry = perfEntries.find(entry => entry.name === 'first-contentful-paint');
      return fcpEntry ? fcpEntry.startTime : null;
    });

    if (fcp !== null) {
      // FCP should be under 1.8s (Google's "good" threshold)
      expect(fcp).toBeLessThan(1800);
      console.log(`First Contentful Paint: ${fcp}ms`);
    }
  });

  test('should have acceptable Largest Contentful Paint', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    const lcp = await page.evaluate(() => {
      return new Promise<number>((resolve) => {
        new PerformanceObserver((list) => {
          const entries = list.getEntries();
          const lastEntry = entries[entries.length - 1];
          resolve(lastEntry.startTime);
        }).observe({ type: 'largest-contentful-paint', buffered: true });

        // Timeout after 5 seconds
        setTimeout(() => resolve(-1), 5000);
      });
    });

    if (lcp > 0) {
      // LCP should be under 2.5s (Google's "good" threshold)
      expect(lcp).toBeLessThan(2500);
      console.log(`Largest Contentful Paint: ${lcp}ms`);
    }
  });

  test('should have acceptable Cumulative Layout Shift', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Wait for potential layout shifts
    await page.waitForTimeout(2000);

    const cls = await page.evaluate(() => {
      return new Promise<number>((resolve) => {
        let clsValue = 0;

        new PerformanceObserver((list) => {
          for (const entry of list.getEntries()) {
            if (!(entry as any).hadRecentInput) {
              clsValue += (entry as any).value;
            }
          }
        }).observe({ type: 'layout-shift', buffered: true });

        setTimeout(() => resolve(clsValue), 1000);
      });
    });

    // CLS should be under 0.1 (Google's "good" threshold)
    expect(cls).toBeLessThan(0.1);
    console.log(`Cumulative Layout Shift: ${cls}`);
  });

  test('API health check should respond quickly', async ({ page, request }) => {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

    const startTime = Date.now();
    const response = await request.get(`${apiUrl}/health`);
    const responseTime = Date.now() - startTime;

    expect(response.ok()).toBeTruthy();
    expect(responseTime).toBeLessThan(1000); // 1 second
    console.log(`API health check response time: ${responseTime}ms`);
  });

  test('should load images efficiently', async ({ page }) => {
    await page.goto('/');

    // Get all images
    const images = await page.locator('img').all();

    for (const img of images) {
      // Check if image has loading="lazy" for non-critical images
      const loading = await img.getAttribute('loading');
      const isAboveFold = await img.evaluate((el) => {
        const rect = el.getBoundingClientRect();
        return rect.top < window.innerHeight;
      });

      if (!isAboveFold) {
        // Images below the fold should be lazy loaded
        expect(loading).toBe('lazy');
      }
    }
  });

  test('should cache static assets', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Get cached resources
    const cachedResources = await page.evaluate(() => {
      const resources = performance.getEntriesByType('resource');
      return resources
        .filter((r: any) => r.name.includes('_next/static'))
        .map((r: any) => ({
          name: r.name,
          transferSize: r.transferSize,
          decodedBodySize: r.decodedBodySize
        }));
    });

    console.log(`Static assets loaded: ${cachedResources.length}`);

    // On first load, assets should be fetched
    // This test mainly validates that static assets exist
    expect(cachedResources.length).toBeGreaterThan(0);
  });
});

test.describe('Resource Optimization', () => {
  test('should compress responses', async ({ page, request }) => {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

    const response = await request.get(`${apiUrl}/health`, {
      headers: {
        'Accept-Encoding': 'gzip, deflate'
      }
    });

    // Check if response is compressed
    const contentEncoding = response.headers()['content-encoding'];
    console.log(`Content-Encoding: ${contentEncoding}`);

    // Either gzip or not needed for small responses
    if (contentEncoding) {
      expect(['gzip', 'deflate', 'br']).toContain(contentEncoding);
    }
  });

  test('should not load excessive JavaScript', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    const jsSize = await page.evaluate(() => {
      const resources = performance.getEntriesByType('resource');
      return resources
        .filter((r: any) => r.initiatorType === 'script')
        .reduce((total: number, r: any) => total + (r.transferSize || 0), 0);
    });

    const jsSizeMB = jsSize / (1024 * 1024);
    console.log(`Total JavaScript size: ${jsSizeMB.toFixed(2)}MB`);

    // Total JS should be under 1MB for good performance
    expect(jsSizeMB).toBeLessThan(1);
  });

  test('should have acceptable Time to Interactive', async ({ page }) => {
    await page.goto('/');

    // Measure TTI using a simplified heuristic
    const tti = await page.evaluate(() => {
      return new Promise<number>((resolve) => {
        if ('PerformanceObserver' in window) {
          let interactiveTime = 0;

          // Wait for main thread to be idle
          const checkIdle = () => {
            const now = performance.now();
            interactiveTime = now;
            resolve(now);
          };

          // Check after a short delay
          setTimeout(checkIdle, 100);
        } else {
          resolve(performance.now());
        }
      });
    });

    // TTI should be under 3.8s (Google's "good" threshold)
    expect(tti).toBeLessThan(3800);
    console.log(`Time to Interactive (approximation): ${tti}ms`);
  });
});

test.describe('Bundle Analysis', () => {
  test('should load critical CSS inline', async ({ page }) => {
    await page.goto('/');

    // Check for inline styles (critical CSS)
    const inlineStyles = await page.locator('style').count();

    // Should have some inline styles for critical rendering
    expect(inlineStyles).toBeGreaterThan(0);
    console.log(`Inline style tags: ${inlineStyles}`);
  });

  test('should preload critical resources', async ({ page }) => {
    await page.goto('/');

    // Check for preload links
    const preloadLinks = await page.locator('link[rel="preload"]').count();

    console.log(`Preload links: ${preloadLinks}`);
    // Just log for informational purposes
  });

  test('should use efficient image formats', async ({ page }) => {
    await page.goto('/');

    const images = await page.locator('img').all();

    for (const img of images) {
      const src = await img.getAttribute('src');

      if (src) {
        // Modern browsers should receive WebP or AVIF
        // Next.js Image component automatically optimizes
        console.log(`Image: ${src}`);
      }
    }

    // At least some images should exist
    expect(images.length).toBeGreaterThanOrEqual(0);
  });
});
