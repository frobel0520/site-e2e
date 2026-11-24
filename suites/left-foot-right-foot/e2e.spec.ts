import { expect, test } from '@playwright/test';
import { runSiteBaseline } from '../../shared/baseline.js';

const SITE_URL = 'https://frobel0520.github.io/left-foot-right-foot/';

test.describe('left-foot-right-foot', () => {
  test('passes public baseline', async ({ page }) => {
    await runSiteBaseline(page, SITE_URL);
  });

  test('fresh visit starts on level 1 with levels 2-10 locked', async ({ page }) => {
    await page.goto(SITE_URL, { waitUntil: 'domcontentloaded' });

    await expect(page.getByRole('heading', { level: 1, name: '左腳踩右腳' })).toBeVisible();
    await expect(page.getByRole('heading', { level: 2, name: '失控鍋爐房' })).toBeVisible();
    await expect(page.getByRole('link', { name: /更多遊戲/ })).toHaveAttribute('href', /playmint\.pages\.dev/);

    const levels = page.getByRole('button', { name: /^第 \d+ 關：/ });
    await expect(levels).toHaveCount(10);
    await expect(levels.nth(0)).toBeEnabled();
    for (let i = 1; i < 10; i += 1) {
      await expect(levels.nth(i)).toBeDisabled();
    }
  });

  test('launch is enabled only after all parts are allocated, and reset restores them', async ({ page }) => {
    const pageErrors: string[] = [];
    page.on('pageerror', (err) => pageErrors.push(err.message));

    await page.goto(SITE_URL, { waitUntil: 'domcontentloaded' });

    const remaining = (n: number) => page.getByRole('button', { name: `尚餘 ${n} 枚黃銅螺帽` });
    const launch = page.getByRole('button', { name: '啟動閉環' });
    const upgradeCoil = page.getByRole('button', { name: '升級電弧線圈' });
    const removeCoil = page.getByRole('button', { name: '移除電弧線圈的黃銅螺帽' });

    await expect(remaining(4)).toBeDisabled();
    await expect(removeCoil).toBeDisabled();

    await upgradeCoil.click();
    await expect(remaining(3)).toBeDisabled();
    await expect(removeCoil).toBeEnabled();

    await page.getByRole('button', { name: '升級黃銅鍋爐' }).click();
    await page.getByRole('button', { name: '升級黃銅鍋爐' }).click();
    await page.getByRole('button', { name: '升級回收渦輪' }).click();

    await expect(launch).toBeEnabled();
    await expect(upgradeCoil).toBeDisabled();

    await page.getByRole('button', { name: '清空本關配置' }).click();
    await expect(remaining(4)).toBeDisabled();
    await expect(launch).toHaveCount(0);

    expect(pageErrors, 'Expected zero page errors while allocating parts').toEqual([]);
  });
});
