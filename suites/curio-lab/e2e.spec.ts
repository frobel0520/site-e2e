import { expect, test, type Page } from '@playwright/test';
import { runSiteBaseline } from '../../shared/baseline.js';

const SITE_URL = 'https://www.curio-lab.workers.dev/';

/** Records any request that could upload or store data (sharing must never be triggered). */
function watchWriteRequests(page: Page): string[] {
  const writes: string[] = [];
  page.on('request', (req) => {
    const method = req.method().toUpperCase();
    if (['POST', 'PUT', 'PATCH', 'DELETE'].includes(method)) {
      writes.push(`${method} ${req.url()}`);
    }
  });
  return writes;
}

test.describe('curio-lab', () => {
  test('passes public baseline', async ({ page }) => {
    await runSiteBaseline(page, SITE_URL);
  });

  test('home lists both tools and each tool page opens', async ({ page }) => {
    await page.goto(SITE_URL, { waitUntil: 'domcontentloaded' });

    const costLink = page.locator('a[href="/tools/cat-cost"]').first();
    const personalityLink = page.locator('a[href="/tools/cat-personality"]').first();
    await expect(costLink).toContainText('主子帳本');
    await expect(personalityLink).toContainText('16 型貓格');

    await costLink.click();
    await expect(page).toHaveURL(/\/tools\/cat-cost\/?$/);
    await expect(page.getByRole('link', { name: /開始算主子身價/ })).toBeVisible();
    await expect(page.locator('main')).toContainText('不需登入');

    await page.goto(new URL('/tools/cat-personality', SITE_URL).toString(), { waitUntil: 'domcontentloaded' });
    await expect(page.getByRole('link', { name: /開始觀察主子/ })).toBeVisible();
  });

  test('personality quiz keeps an answer across next and previous without writes', async ({ page }) => {
    const writes = watchWriteRequests(page);
    const pageErrors: string[] = [];
    page.on('pageerror', (err) => pageErrors.push(err.message));

    await page.goto(new URL('/tools/cat-personality', SITE_URL).toString(), { waitUntil: 'networkidle' });
    await page.getByRole('link', { name: /開始觀察主子/ }).click();
    await expect(page).toHaveURL(/\/tools\/cat-personality\/quiz\/?$/);

    const main = page.locator('main');
    await expect(main).toContainText('01 / 20');
    const options = main.getByRole('radio');
    await expect(options).toHaveCount(4);

    await options.nth(1).click();
    await expect(options.nth(1)).toHaveAttribute('aria-checked', 'true');

    await main.getByRole('button', { name: /下一題/ }).click();
    await expect(main).toContainText('02 / 20');

    await main.getByRole('button', { name: /上一題/ }).click();
    await expect(main).toContainText('01 / 20');
    await expect(main.getByRole('radio').nth(1)).toHaveAttribute('aria-checked', 'true');

    expect(writes, 'Expected no write/upload requests while answering').toEqual([]);
    expect(pageErrors, 'Expected zero page errors during the quiz').toEqual([]);
  });
});
