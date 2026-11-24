import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { chromium, expect } from '@playwright/test';

const sourceDirectory = process.argv[2];
assert.ok(sourceDirectory, 'Pass the path to a local pikmin-mushroom-room checkout');

const syntheticPoints = { col1: ['合成點位 A'], col2: ['合成點位 B'], col3: [], col4: [] };
const pointDeclaration = /^const points = \{[\s\S]*?^\};/m;
const source = await readFile(resolve(sourceDirectory, 'js/app.js'), 'utf8');
assert.ok(pointDeclaration.test(source), 'The source point declaration must be identifiable before loading');
const isolatedSource = source.replace(pointDeclaration, () => `const points = ${JSON.stringify(syntheticPoints)};`);
const now = Date.parse('2026-01-01T00:00:00Z');

const browser = await chromium.launch();
try {
  const context = await browser.newContext({ offline: true, serviceWorkers: 'block' });
  const externalRequests = [];
  await context.route('**/*', (route) => {
    externalRequests.push(new URL(route.request().url()).origin);
    return route.abort();
  });
  const page = await context.newPage();
  const errors = [];
  page.on('pageerror', (error) => errors.push(error.message));
  await page.clock.setFixedTime(now);
  await page.setContent(
    '<div class="sync-hint"></div><main id="mapGrid"><div id="col1"></div><div id="col2"></div><div id="col3"></div><div id="col4"></div></main>',
  );
  await page.evaluate(({ now, first, second }) => {
    const url = 'https://example.invalid';
    const key = 'synthetic-key';
    window.SUPABASE_URL = url;
    window.SUPABASE_ANON_KEY = key;
    window.fixtureWrites = [];
    window.supabase = {
      createClient(givenUrl, givenKey) {
        if (givenUrl !== url || givenKey !== key) throw new Error('Unexpected fixture configuration');
        return {
          from(table) {
            if (table !== 'mushroom_timers') throw new Error('Unexpected fixture table');
            return {
              select: async () => ({
                data: [{ point_name: first, rebirth_at: null }, { point_name: second, rebirth_at: now }],
                error: null,
              }),
              upsert: async (row, options) => {
                window.fixtureWrites.push({ row, options });
                return { error: null };
              },
            };
          },
          channel() {
            return {
              on(_kind, _filter, callback) {
                window.sendFixtureUpdate = callback;
                return { subscribe() {} };
              },
            };
          },
        };
      },
    };
  }, { now, first: syntheticPoints.col1[0], second: syntheticPoints.col2[0] });
  await page.addScriptTag({ content: isolatedSource });

  const first = page.locator('.mush-card').filter({ hasText: '合成點位 A' });
  const second = page.locator('.mush-card').filter({ hasText: '合成點位 B' });
  await expect(first.locator('.timer-display')).toHaveText('--:--:--');
  await expect(second.locator('.timer-display')).toHaveText('🍄 已重生！');

  await first.getByRole('spinbutton', { name: '合成點位 A 分鐘' }).fill('2');
  await first.getByRole('button', { name: '開始倒數！' }).click();
  await expect(first.locator('.timer-display')).toHaveText('00:07:00');
  await expect(first.getByRole('spinbutton', { name: '合成點位 A 分鐘' })).toHaveValue('');
  assert.deepEqual(await page.evaluate(() => window.fixtureWrites), [
    {
      row: { point_name: syntheticPoints.col1[0], rebirth_at: now + 7 * 60_000, updated_at: new Date(now).toISOString() },
      options: { onConflict: 'point_name' },
    },
  ]);

  await page.evaluate(({ point, rebirth }) => window.sendFixtureUpdate({
    eventType: 'UPDATE',
    new: { point_name: point, rebirth_at: rebirth },
  }), { point: syntheticPoints.col1[0], rebirth: now + 60_000 });
  await expect(first.locator('.timer-display')).toHaveText('00:01:00');
  await expect(first.locator('.timer-display')).toHaveClass(/\bactive\b/);

  assert.deepEqual(externalRequests, []);
  assert.deepEqual(errors, []);
  console.log('Pikmin fixture passed: initial state, five-minute buffer, isolated write, Realtime warning, zero network.');
} finally {
  await browser.close();
}
