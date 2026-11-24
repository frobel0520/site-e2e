import { expect, test, type Page } from '@playwright/test';
import { runSiteBaseline } from '../../shared/baseline.js';

const SITE_URL = 'https://nihongo-sync.curio-lab.workers.dev/nihongo-lab/';

/** Records requests that would write data or reach a sign-in provider. */
function watchForbiddenRequests(page: Page): string[] {
  const forbidden: string[] = [];
  page.on('request', (req) => {
    const url = req.url();
    if (!url.startsWith('http://') && !url.startsWith('https://')) {
      return;
    }
    const method = req.method().toUpperCase();
    const host = new URL(url).hostname;
    if (['POST', 'PUT', 'PATCH', 'DELETE'].includes(method)) {
      forbidden.push(`${method} ${url}`);
    }
    if (host === 'accounts.google.com' || host.endsWith('.googleusercontent.com')) {
      forbidden.push(`sign-in ${url}`);
    }
  });
  return forbidden;
}

test.describe('nihongo-lab', () => {
  test('passes public baseline', async ({ page }) => {
    await runSiteBaseline(page, SITE_URL);
    await expect(page.getByRole('heading', { level: 1, name: 'かなの日本語' })).toBeVisible();
  });

  test('home opens the first N5 lesson and bottom navigation pages', async ({ page }) => {
    const pageErrors: string[] = [];
    page.on('pageerror', (err) => pageErrors.push(err.message));

    await page.goto(SITE_URL, { waitUntil: 'networkidle' });

    await page.getByRole('link', { name: '開始學習' }).first().click();
    await expect(page).toHaveURL(/#\/lesson\/stage0-day1$/);
    await expect(page.getByRole('heading', { level: 1 })).toContainText('第 1 天');
    await expect(page.getByRole('link', { name: '返回課程清單' })).toBeVisible();

    for (const [label, hash] of [
      ['聽寫', '#/dictation'],
      ['跟讀', '#/shadowing'],
      ['設定', '#/settings'],
    ] as const) {
      await page.getByRole('link', { name: label, exact: true }).click();
      await expect(page).toHaveURL(new RegExp(`${hash.replace('/', '\\/')}$`));
      await expect(page.locator('main')).not.toBeEmpty();
    }

    expect(pageErrors, 'Expected zero page errors while navigating').toEqual([]);
  });

  test('N5 flashcard reveals reading and meaning without writes or sign-in', async ({ page }) => {
    const forbidden = watchForbiddenRequests(page);
    const pageErrors: string[] = [];
    page.on('pageerror', (err) => pageErrors.push(err.message));

    await page.goto(`${SITE_URL}#/srs/new?category=n5`, { waitUntil: 'networkidle' });

    const main = page.locator('main');
    const reveal = main.getByRole('button', { name: '顯示答案' });
    await expect(reveal).toBeVisible();
    await expect(main.getByRole('button', { name: /記得/ })).toHaveCount(0);

    await reveal.click();

    await expect(main).toContainText('わたし');
    await expect(main).toContainText('我');
    await expect(main.getByRole('button', { name: /還不會/ })).toBeVisible();
    await expect(main.getByRole('button', { name: /記得/ })).toBeVisible();

    expect(forbidden, 'Expected no write requests or sign-in redirects').toEqual([]);
    expect(pageErrors, 'Expected zero page errors on flashcards').toEqual([]);
  });
});
