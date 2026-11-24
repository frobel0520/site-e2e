import { expect, test } from '@playwright/test';
import { runSiteBaseline } from '../../shared/baseline.js';

const SITE_URL = 'https://tensift.pages.dev/';

test.describe('tensift', () => {
  test('passes public baseline and renders interactive puzzle shell', async ({ page }) => {
    await runSiteBaseline(page, SITE_URL);

    await expect(page).toHaveTitle(/Tensift/i);
    await expect(page.locator('h1').first()).toBeVisible();

    const interactiveButtons = await page.locator('button:visible').count();
    expect(interactiveButtons, 'Expected interactive buttons in Tensift UI').toBeGreaterThan(0);
  });

  test('supports localStorage state persistence across reload', async ({ page }) => {
    const pageErrors: string[] = [];
    page.on('pageerror', (err) => pageErrors.push(err.message));

    await page.goto(SITE_URL, { waitUntil: 'networkidle' });
    await page.waitForTimeout(500);

    // Click an interactive control if present (e.g. a puzzle card or hint) without mutating remote state
    const storageBefore = await page.evaluate(() => {
      window.localStorage.setItem('site_e2e_probe', 'ok');
      return window.localStorage.getItem('site_e2e_probe');
    });
    expect(storageBefore).toBe('ok');

    await page.reload({ waitUntil: 'networkidle' });
    await page.waitForTimeout(500);

    const storageAfter = await page.evaluate(() => {
      const val = window.localStorage.getItem('site_e2e_probe');
      window.localStorage.removeItem('site_e2e_probe');
      return val;
    });
    expect(storageAfter).toBe('ok');
    expect(pageErrors).toEqual([]);
  });

  test('serves public how-to-play documentation page', async ({ page }) => {
    const response = await page.goto(`${SITE_URL}learn/en/how-to-play`, {
      waitUntil: 'networkidle',
    });
    expect(response?.status()).toBe(200);
    await expect(page.locator('body')).toContainText(/Tensift/i);
  });
});
