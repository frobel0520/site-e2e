import { expect, test } from '@playwright/test';
import { runSiteBaseline } from '../../shared/baseline.js';

const SITE_URL = 'https://playmint.pages.dev/';

const EXPECTED_GAME_HOSTS = [
  'tensift.pages.dev',
  'frobel0520.github.io/left-foot-right-foot',
  'playmint-little-days.pages.dev',
];

test.describe('playmint', () => {
  test('passes public baseline and displays all catalog game links', async ({ page }) => {
    await runSiteBaseline(page, SITE_URL);

    await expect(page).toHaveTitle(/Playmint/i);

    const hrefs = await page.locator('a[href]').evaluateAll((anchors) =>
      anchors.map((a) => a.getAttribute('href') ?? ''),
    );

    for (const host of EXPECTED_GAME_HOSTS) {
      expect(
        hrefs.some((href) => href.includes(host)),
        `Expected Playmint catalog to link to ${host}`,
      ).toBe(true);
    }
  });

  test('navigates cleanly from Playmint portal to Tensift', async ({ page }) => {
    const pageErrors: string[] = [];
    page.on('pageerror', (err) => pageErrors.push(err.message));

    await page.goto(SITE_URL, { waitUntil: 'networkidle' });

    const tensiftLink = page.locator('a[href*="tensift.pages.dev"]').first();
    await expect(tensiftLink).toBeVisible();

    const targetHref = await tensiftLink.getAttribute('href');
    expect(targetHref).toBeTruthy();

    const response = await page.goto(targetHref!, { waitUntil: 'networkidle' });
    expect(response?.status()).toBe(200);
    await expect(page).toHaveTitle(/Tensift/i);
    expect(pageErrors).toEqual([]);
  });
});
