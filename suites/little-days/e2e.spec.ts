import { expect, test, type Page } from '@playwright/test';
import { runSiteBaseline } from '../../shared/baseline.js';

const SITE_URL = 'https://playmint-little-days.pages.dev/';
/** `?playtest=1` uses an isolated test save and exposes read-only `window.littleDaysState` (source README「存檔」). */
const PLAYTEST_URL = `${SITE_URL}?playtest=1`;
const PLAYER_SAVE_KEY = 'little-days-godot-v1';

interface Control {
  x: number;
  y: number;
  visible?: boolean;
  disabled: boolean;
  pressed: boolean;
}

interface GameState {
  chapter_count: number;
  count: number;
  selected: string | null;
  buttons: Record<string, Control>;
  item_buttons: Record<string, Control>;
  surface_buttons: Record<string, Control>;
  scroll: { x: number; y: number; top: number; bottom: number };
  state: Record<string, { surface: string }>;
}

async function readState(page: Page): Promise<GameState | null> {
  // page.evaluate goes through DevTools, so it is not blocked by the game's CSP (no 'unsafe-eval').
  const raw = await page.evaluate(() => (window as unknown as { littleDaysState?: string }).littleDaysState ?? null);
  return raw ? (JSON.parse(raw) as GameState) : null;
}

async function waitForState(
  page: Page,
  predicate: (s: GameState) => boolean,
  message: string,
  timeout = 20_000,
): Promise<GameState> {
  let last: GameState | null = null;
  await expect
    .poll(
      async () => {
        last = await readState(page);
        return last !== null && predicate(last);
      },
      { message, timeout, intervals: [100, 250, 500] },
    )
    .toBe(true);
  return last!;
}

/** Clicks a Godot UI control using the screen coordinates the game publishes, scrolling lists if needed. */
async function clickControl(page: Page, group: 'buttons' | 'item_buttons' | 'surface_buttons', key: string): Promise<void> {
  let control: Control | undefined;
  for (let attempt = 0; attempt < 18; attempt += 1) {
    const s = (await readState(page))!;
    control = s[group][key];
    expect(control, `Expected control ${group}.${key}`).toBeTruthy();
    if (group !== 'item_buttons' || (control.y > s.scroll.top + 8 && control.y < s.scroll.bottom - 8)) {
      break;
    }
    await page.mouse.move(s.scroll.x, s.scroll.y);
    await page.mouse.wheel(0, control.y >= s.scroll.bottom - 8 ? 130 : -130);
    await page.waitForTimeout(160);
  }
  expect(control!.disabled, `Expected ${group}.${key} to be enabled`).toBe(false);
  await page.mouse.move(control!.x, control!.y);
  await page.mouse.down();
  await waitForState(page, (s) => s[group][key].pressed, `${group}.${key} pressed`);
  await page.mouse.up();
  await waitForState(page, (s) => !s[group][key].pressed, `${group}.${key} released`);
}

test.describe('little-days', () => {
  test('passes public baseline', async ({ page }) => {
    test.setTimeout(180_000);
    // Godot renders everything into a WebGL canvas, so there is no DOM text to check.
    await runSiteBaseline(page, SITE_URL, { settleMs: 1500, requireVisibleText: false });
    await expect(page.locator('canvas').first()).toBeVisible();
  });

  test('playtest mode boots the 3D game and places an item without touching the player save', async ({ page }) => {
    test.setTimeout(180_000);
    const pageErrors: string[] = [];
    const scriptErrors: string[] = [];
    page.on('pageerror', (err) => pageErrors.push(err.message));
    page.on('console', (msg) => {
      const text = msg.text();
      if (text.includes('SCRIPT ERROR') || text.includes('USER ERROR')) {
        scriptErrors.push(text);
      }
    });

    await page.setViewportSize({ width: 1360, height: 920 });
    await page.goto(PLAYTEST_URL);

    const initial = await waitForState(page, () => true, 'Godot game publishes playtest state', 120_000);
    expect(initial.chapter_count, 'Expected 11 daily scenes (6 main + 5 drawer)').toBe(11);
    expect(initial.count, 'Expected a fresh playtest save with nothing put away').toBe(0);
    expect(initial.buttons.finish.disabled, 'Expected 「今天收好了」 disabled before tidying').toBe(true);

    await clickControl(page, 'item_buttons', 'camera');
    await waitForState(page, (s) => s.selected === 'camera', 'camera selected');
    await clickControl(page, 'surface_buttons', 'shelf-high');
    await waitForState(page, (s) => s.state.camera?.surface === 'shelf-high', 'camera placed on the high shelf');

    const playerSave = await page.evaluate((key) => localStorage.getItem(key), PLAYER_SAVE_KEY);
    expect(playerSave, 'Playtest mode must not write the player save').toBeNull();
    expect(pageErrors, 'Expected zero page errors').toEqual([]);
    expect(scriptErrors, 'Expected zero Godot script errors').toEqual([]);
  });
});
