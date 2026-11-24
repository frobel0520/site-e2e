import { expect, test } from '@playwright/test';
import { runSiteBaseline, SYNTHETIC_PNG_1X1 } from '../../shared/baseline.js';

const SITE_URL = 'https://media-craft.pages.dev/';

test.describe('media-craft', () => {
  test('passes public baseline and strict local CSP check', async ({ page }) => {
    await runSiteBaseline(page, SITE_URL);

    const csp = await page.locator('meta[http-equiv="Content-Security-Policy"]').getAttribute('content');
    expect(csp, 'Expected strict Content-Security-Policy meta tag').toBeTruthy();
    expect(csp!).toContain("connect-src 'self'");
  });

  test('processes synthetic 1x1 PNG locally with zero outbound uploads', async ({ page }) => {
    const targetOrigin = new URL(SITE_URL).origin;
    const outboundRequests: string[] = [];
    const mutationRequests: string[] = [];
    const pageErrors: string[] = [];

    page.on('pageerror', (err) => pageErrors.push(err.message));
    page.on('request', (req) => {
      const url = req.url();
      if (!url.startsWith('http://') && !url.startsWith('https://')) {
        return;
      }
      const origin = new URL(url).origin;
      if (origin !== targetOrigin) {
        outboundRequests.push(`${req.method()} ${url}`);
      }
      if (['POST', 'PUT', 'PATCH'].includes(req.method().toUpperCase())) {
        mutationRequests.push(`${req.method()} ${url}`);
      }
    });

    await page.goto(SITE_URL, { waitUntil: 'networkidle' });

    const fileInput = page.locator('input[type="file"]').first();
    await expect(fileInput).toBeAttached();

    await fileInput.setInputFiles({
      name: 'synthetic-test.png',
      mimeType: 'image/png',
      buffer: SYNTHETIC_PNG_1X1,
    });

    // Wait briefly for Web Worker / WASM local processing
    await page.waitForTimeout(1500);

    // File name or processed item should be reflected in the workspace UI
    await expect(page.locator('body')).toContainText('synthetic-test');
    expect(outboundRequests, 'Expected zero requests to external origins').toEqual([]);
    expect(mutationRequests, 'Expected zero POST/PUT/PATCH upload requests').toEqual([]);
    expect(pageErrors, 'Expected zero page errors during local image processing').toEqual([]);
  });
});
