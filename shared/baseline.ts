import { expect, type Page } from '@playwright/test';

export interface BaselineOptions {
  /** Extra wait after DOM load for SPA hydration (ms). Default: 600 */
  settleMs?: number;
  /** Optional list of console error substrings to ignore (avoid unless strictly necessary). */
  ignoreConsoleErrors?: RegExp[];
  /** Whether to test both light and dark prefers-color-scheme. Default: true */
  checkColorSchemes?: boolean;
  /** Whether to check mobile viewport (375x812) horizontal overflow. Default: true */
  checkMobileOverflow?: boolean;
  /** Allowable pixel tolerance for scrollWidth vs innerWidth. Default: 1 */
  overflowTolerancePx?: number;
  /** Require visible DOM text. Disable only for canvas-only apps (e.g. WebGL games). Default: true */
  requireVisibleText?: boolean;
}

export interface BaselineResult {
  pageErrors: string[];
  consoleErrors: string[];
  failedSameOriginRequests: string[];
}

/**
 * Valid synthetic 1x1 transparent PNG (67 bytes).
 * Safe to use for local/WASM upload tests without real user files.
 */
export const SYNTHETIC_PNG_1X1 = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==',
  'base64',
);

/**
 * Shared public-site smoke & layout baseline:
 * - HTTP 200 on document navigation
 * - Non-empty <title>
 * - Zero uncaught pageerror
 * - Zero console.error
 * - Zero same-origin HTTP >= 400 responses
 * - Zero broken visible <img> elements (naturalWidth > 0)
 * - Zero horizontal overflow on desktop (1280x900) and mobile (375x812)
 * - Clean rendering under both light and dark color schemes
 */
export async function runSiteBaseline(
  page: Page,
  url: string,
  options: BaselineOptions = {},
): Promise<BaselineResult> {
  const {
    settleMs = 600,
    ignoreConsoleErrors = [],
    checkColorSchemes = true,
    checkMobileOverflow = true,
    overflowTolerancePx = 1,
    requireVisibleText = true,
  } = options;

  const targetOrigin = new URL(url).origin;
  const pageErrors: string[] = [];
  const consoleErrors: string[] = [];
  const failedSameOriginRequests: string[] = [];

  page.on('pageerror', (err) => {
    pageErrors.push(err.message);
  });

  page.on('console', (msg) => {
    if (msg.type() === 'error') {
      const text = msg.text();
      if (!ignoreConsoleErrors.some((re) => re.test(text))) {
        consoleErrors.push(text);
      }
    }
  });

  page.on('response', (res) => {
    try {
      const resOrigin = new URL(res.url()).origin;
      if (resOrigin === targetOrigin && res.status() >= 400) {
        failedSameOriginRequests.push(`${res.status()} ${res.url()}`);
      }
    } catch {
      // Ignore non-HTTP URLs (data:, blob:)
    }
  });

  // 1. Desktop (1280x900) light scheme
  await page.setViewportSize({ width: 1280, height: 900 });
  await page.emulateMedia({ colorScheme: 'light' });

  const response = await page.goto(url, { waitUntil: 'networkidle' });
  expect(response, `Expected a response navigating to ${url}`).not.toBeNull();
  expect(response!.status(), `Expected HTTP 200 from ${url}`).toBe(200);

  if (settleMs > 0) {
    await page.waitForTimeout(settleMs);
  }

  // Non-empty title
  const title = (await page.title()).trim();
  expect(title.length, `Expected non-empty <title> on ${url}`).toBeGreaterThan(0);

  // Visible text exists (canvas-only apps opt out explicitly)
  if (requireVisibleText) {
    const bodyTextLength = await page.evaluate(() => (document.body?.innerText ?? '').trim().length);
    expect(bodyTextLength, `Expected visible body text on ${url}`).toBeGreaterThan(0);
  }

  // No broken visible images
  const brokenImages = await page.evaluate(() => {
    const imgs = Array.from(document.querySelectorAll('img'));
    return imgs
      .filter((img) => {
        const style = window.getComputedStyle(img);
        const rect = img.getBoundingClientRect();
        return style.display !== 'none' && style.visibility !== 'hidden' && rect.width > 0 && rect.height > 0;
      })
      .filter((img) => !img.complete || img.naturalWidth === 0)
      .map((img) => img.getAttribute('src') || '(no src)');
  });
  expect(brokenImages, `Broken visible images on ${url}`).toEqual([]);

  // Desktop horizontal overflow check
  const desktopOverflow = await page.evaluate(() => ({
    scrollWidth: document.documentElement.scrollWidth,
    innerWidth: window.innerWidth,
  }));
  expect(
    desktopOverflow.scrollWidth,
    `Desktop horizontal overflow on ${url}: scrollWidth=${desktopOverflow.scrollWidth} > innerWidth=${desktopOverflow.innerWidth}`,
  ).toBeLessThanOrEqual(desktopOverflow.innerWidth + overflowTolerancePx);

  // 2. Dark color scheme check (ensures no runtime crash on theme switch)
  if (checkColorSchemes) {
    await page.emulateMedia({ colorScheme: 'dark' });
    await page.waitForTimeout(200);
    await page.emulateMedia({ colorScheme: 'light' });
  }

  // 3. Mobile (375x812) horizontal overflow check
  if (checkMobileOverflow) {
    await page.setViewportSize({ width: 375, height: 812 });
    await page.waitForTimeout(250);
    const mobileOverflow = await page.evaluate(() => ({
      scrollWidth: document.documentElement.scrollWidth,
      innerWidth: window.innerWidth,
    }));
    expect(
      mobileOverflow.scrollWidth,
      `Mobile horizontal overflow on ${url}: scrollWidth=${mobileOverflow.scrollWidth} > innerWidth=${mobileOverflow.innerWidth}`,
    ).toBeLessThanOrEqual(mobileOverflow.innerWidth + overflowTolerancePx);
    // Restore desktop viewport for subsequent steps in the same test
    await page.setViewportSize({ width: 1280, height: 900 });
  }

  expect(pageErrors, `Uncaught pageerror(s) on ${url}`).toEqual([]);
  expect(consoleErrors, `console.error(s) on ${url}`).toEqual([]);
  expect(failedSameOriginRequests, `Same-origin >=400 responses on ${url}`).toEqual([]);

  return { pageErrors, consoleErrors, failedSameOriginRequests };
}
