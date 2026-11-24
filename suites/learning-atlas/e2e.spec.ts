import { expect, test } from '@playwright/test';
import { runSiteBaseline } from '../../shared/baseline.js';

const SITE_URL = 'https://frobel0520.github.io/learning-atlas/';

/** Entry links listed in the source repo README (8 sites + 2 HTML lessons). */
const ENTRY_PATHS = [
  'software-engineering-workshop/',
  'road-to-solution-architect/',
  'guardrail-workshop/',
  'AI-Agent-Tutorial/',
  'aws-lab/',
  'typescript-lab/',
  'golang-lab/',
  'fastapi-learning-lab/',
  'lessons/fsrs.html',
  'lessons/request-journey.html',
] as const;

test.describe('learning-atlas', () => {
  test('passes public baseline', async ({ page }) => {
    await runSiteBaseline(page, SITE_URL);
    await expect(page.getByRole('heading', { level: 1, name: 'Learning Atlas' })).toBeVisible();
  });

  test('lists every site and lesson entry and each one responds 200', async ({ page }) => {
    await page.goto(SITE_URL, { waitUntil: 'domcontentloaded' });

    const hrefs = await page
      .locator('a[href]')
      .evaluateAll((links) => links.map((a) => a.getAttribute('href') ?? ''));

    for (const path of ENTRY_PATHS) {
      expect(hrefs, `Expected an entry link to ${path}`).toContain(path);
      const res = await page.request.get(new URL(path, SITE_URL).toString());
      expect(res.status(), `Expected HTTP 200 from ${path}`).toBe(200);
    }
  });

  test('mobile menu opens, closes after picking a route, and closes on Escape', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 });
    await page.goto(SITE_URL, { waitUntil: 'domcontentloaded' });

    const menu = page.getByRole('button', { name: '開啟選單' });
    const sidebar = page.locator('#sidebar');
    await expect(menu).toBeVisible();
    await expect(menu).toHaveAttribute('aria-expanded', 'false');

    await menu.click();
    await expect(menu).toHaveAttribute('aria-expanded', 'true');
    await expect(sidebar).toHaveClass(/\bopen\b/);

    await sidebar.locator('a[href="#lessons"]').click();
    await expect(menu).toHaveAttribute('aria-expanded', 'false');
    await expect(sidebar).not.toHaveClass(/\bopen\b/);
    await expect(page).toHaveURL(/#lessons$/);

    await menu.click();
    await expect(menu).toHaveAttribute('aria-expanded', 'true');
    await page.keyboard.press('Escape');
    await expect(menu).toHaveAttribute('aria-expanded', 'false');
  });
});
