import { test, expect } from '@playwright/test';

// INITIAL_LETTERS grid (deterministic for Classic mode):
// Row 0: S T A R   → STAR: #tile-0-0, #tile-0-1, #tile-0-2, #tile-0-3 → 500 pts
// Row 1: E C E A
// Row 2: R A K T
// Row 3: S L A P   → SLAP: #tile-3-0, #tile-3-1, #tile-3-2, #tile-3-3 → 500 pts

test.describe('Classic mode', () => {

  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.click('#btn-classic');
    await expect(page.locator('#tile-0-0')).toBeVisible();
  });

  // ── Initial state ──────────────────────────────────────────────────────

  test('board renders all 16 tiles', async ({ page }) => {
    for (let r = 0; r < 4; r++) {
      for (let c = 0; c < 4; c++) {
        await expect(page.locator(`#tile-${r}-${c}`)).toBeVisible();
      }
    }
  });

  test('score starts at 0', async ({ page }) => {
    await expect(page.locator('#score-display')).toHaveText('0');
  });

  test('locked count starts at 0 / 16', async ({ page }) => {
    await expect(page.locator('#stat2-value')).toHaveText('0 / 16');
  });

  test('word display shows placeholder before any selection', async ({ page }) => {
    await expect(page.locator('#word-display')).toContainText('tap tiles to select');
  });

  test('submit button is disabled before selection', async ({ page }) => {
    await expect(page.locator('#btn-submit-word')).toBeDisabled();
  });

  test('tile 0-0 shows letter S', async ({ page }) => {
    await expect(page.locator('#tile-0-0')).toHaveText('S');
  });

  test('tile 3-3 shows letter P', async ({ page }) => {
    await expect(page.locator('#tile-3-3')).toHaveText('P');
  });

  // ── Tile selection ─────────────────────────────────────────────────────

  test('clicking a tile updates word-display', async ({ page }) => {
    await page.click('#tile-0-0');
    await expect(page.locator('#word-display')).toContainText('S');
  });

  test('selecting 3 tiles enables submit button', async ({ page }) => {
    await page.click('#tile-0-1'); // T
    await page.click('#tile-0-2'); // A
    await page.click('#tile-0-3'); // R → TAR
    await expect(page.locator('#btn-submit-word')).not.toBeDisabled();
  });

  test('clear button (✕) is hidden before any selection', async ({ page }) => {
    await expect(page.locator('#btn-clear-selection')).toBeHidden();
  });

  test('clear button (✕) appears after a tile is selected', async ({ page }) => {
    await page.click('#tile-0-0');
    await expect(page.locator('#btn-clear-selection')).toBeVisible();
  });

  test('clear button empties selection and hides itself', async ({ page }) => {
    await page.click('#tile-0-0'); // S
    await page.click('#tile-0-1'); // T
    await page.click('#btn-clear-selection');
    await expect(page.locator('#word-display')).toContainText('tap tiles to select');
    await expect(page.locator('#btn-submit-word')).toBeDisabled();
    await expect(page.locator('#btn-clear-selection')).toBeHidden();
  });

  test('re-tapping a selected tile truncates selection back to it', async ({ page }) => {
    await page.click('#tile-0-0'); // S
    await page.click('#tile-0-1'); // T
    await page.click('#tile-0-2'); // A
    // Re-tap T to truncate back to just S
    await page.click('#tile-0-1');
    const wordText = await page.locator('#word-display').textContent();
    expect(wordText).not.toContain('A');
  });

  // ── Word submission — STAR ─────────────────────────────────────────────

  test('submitting STAR scores 500 pts', async ({ page }) => {
    await page.click('#tile-0-0'); // S
    await page.click('#tile-0-1'); // T
    await page.click('#tile-0-2'); // A
    await page.click('#tile-0-3'); // R
    await page.click('#btn-submit-word');

    await expect(page.locator('#score-display')).toHaveText('500');
  });

  test('submitting STAR locks 4 tiles (stat2 becomes 4 / 16)', async ({ page }) => {
    await page.click('#tile-0-0');
    await page.click('#tile-0-1');
    await page.click('#tile-0-2');
    await page.click('#tile-0-3');
    await page.click('#btn-submit-word');

    await expect(page.locator('#stat2-value')).toHaveText('4 / 16');
  });

  test('STAR tiles get tile-locked class after commit', async ({ page }) => {
    await page.click('#tile-0-0');
    await page.click('#tile-0-1');
    await page.click('#tile-0-2');
    await page.click('#tile-0-3');
    await page.click('#btn-submit-word');

    for (let c = 0; c < 4; c++) {
      await expect(page.locator(`#tile-0-${c}`)).toHaveClass(/tile-locked/);
    }
  });

  test('word display shows score notification after STAR commit', async ({ page }) => {
    await page.click('#tile-0-0');
    await page.click('#tile-0-1');
    await page.click('#tile-0-2');
    await page.click('#tile-0-3');
    await page.click('#btn-submit-word');

    await expect(page.locator('#word-display')).toContainText('+500 pts');
  });

  test('message banner is NOT shown for valid word score', async ({ page }) => {
    await page.click('#tile-0-0');
    await page.click('#tile-0-1');
    await page.click('#tile-0-2');
    await page.click('#tile-0-3');
    await page.click('#btn-submit-word');

    await expect(page.locator('#message-banner')).toBeHidden();
  });

  test('word display resets to placeholder after score notification expires', async ({ page }) => {
    await page.click('#tile-0-0');
    await page.click('#tile-0-1');
    await page.click('#tile-0-2');
    await page.click('#tile-0-3');
    await page.click('#btn-submit-word');

    // Notification auto-dismisses after 2000 ms; Playwright retries until it passes
    await expect(page.locator('#word-display')).toContainText('tap tiles to select');
  });

  // ── Word submission — STAR then SLAP ──────────────────────────────────

  test('STAR then SLAP: score becomes 1,000 and 8 tiles locked', async ({ page }) => {
    // Commit STAR
    await page.click('#tile-0-0');
    await page.click('#tile-0-1');
    await page.click('#tile-0-2');
    await page.click('#tile-0-3');
    await page.click('#btn-submit-word');
    await expect(page.locator('#score-display')).toHaveText('500');

    // Commit SLAP
    await page.click('#tile-3-0'); // S
    await page.click('#tile-3-1'); // L
    await page.click('#tile-3-2'); // A
    await page.click('#tile-3-3'); // P
    await page.click('#btn-submit-word');

    await expect(page.locator('#score-display')).toHaveText('1,000');
    await expect(page.locator('#stat2-value')).toHaveText('8 / 16');
  });

  // ── Invalid word ───────────────────────────────────────────────────────

  test('submitting an invalid word shows error message in word display', async ({ page }) => {
    // RAK is not a valid Scrabble word
    await page.click('#tile-2-0'); // R
    await page.click('#tile-2-1'); // A
    await page.click('#tile-2-2'); // K
    await page.click('#btn-submit-word');

    await expect(page.locator('#word-display')).toContainText('not a valid word');
    await expect(page.locator('#message-banner')).toBeHidden();
  });

  test('invalid word does not change score', async ({ page }) => {
    await page.click('#tile-2-0'); // R
    await page.click('#tile-2-1'); // A
    await page.click('#tile-2-2'); // K
    await page.click('#btn-submit-word');

    await expect(page.locator('#score-display')).toHaveText('0');
  });

  test('invalid word submission clears selection after error dismisses', async ({ page }) => {
    await page.click('#tile-2-0'); // R
    await page.click('#tile-2-1'); // A
    await page.click('#tile-2-2'); // K
    await page.click('#btn-submit-word');

    // Error shows in word-display for ~1500ms then auto-dismisses
    await expect(page.locator('#word-display')).toContainText('tap tiles to select');
    await expect(page.locator('#btn-submit-word')).toBeDisabled();
  });

  // ── Spin counter ───────────────────────────────────────────────────────

  test('spin counter box is visible in Classic mode', async ({ page }) => {
    await expect(page.locator('#stat3-box')).toBeVisible();
  });

  test('spin counter starts at 0', async ({ page }) => {
    await expect(page.locator('#spin-display')).toHaveText('0');
  });

  test('spin counter increments to 1 after one pivot', async ({ page }) => {
    await page.locator('[data-pivot-r="0"][data-pivot-c="0"]').click();
    await expect(page.locator('#spin-display')).toHaveText('1');
  });

  test('spin counter increments correctly after multiple pivots', async ({ page }) => {
    await page.locator('[data-pivot-r="0"][data-pivot-c="0"]').click();
    await page.locator('[data-pivot-r="1"][data-pivot-c="1"]').click();
    await page.locator('[data-pivot-r="0"][data-pivot-c="1"]').click();
    await expect(page.locator('#spin-display')).toHaveText('3');
  });

  test('committing a word does not change spin counter', async ({ page }) => {
    await page.click('#tile-0-0'); // S
    await page.click('#tile-0-1'); // T
    await page.click('#tile-0-2'); // A
    await page.click('#tile-0-3'); // R
    await page.click('#btn-submit-word');
    await expect(page.locator('#spin-display')).toHaveText('0');
  });

  test('spin counter resets to 0 after reset', async ({ page }) => {
    await page.locator('[data-pivot-r="0"][data-pivot-c="0"]').click();
    await page.locator('[data-pivot-r="1"][data-pivot-c="1"]').click();
    await expect(page.locator('#spin-display')).toHaveText('2');

    await page.click('#reset-btn');
    await expect(page.locator('#spin-display')).toHaveText('0');
  });

  // ── Pivot buttons ──────────────────────────────────────────────────────

  test('9 pivot buttons are rendered', async ({ page }) => {
    await expect(page.locator('button.pivot-btn')).toHaveCount(9);
  });

  test('pivot (0,0) rotates top-left quadrant', async ({ page }) => {
    // Before pivot: tile-1-0 = E
    const letterBefore = await page.locator('#tile-1-0').textContent();
    await page.locator('[data-pivot-r="0"][data-pivot-c="0"]').click();
    // After clockwise rotation, new tile-0-0 = old tile-1-0
    await expect(page.locator('#tile-0-0')).toHaveText(letterBefore!.trim());
  });

  // ── Reset ──────────────────────────────────────────────────────────────

  test('reset after STAR: score back to 0 and tiles unlocked', async ({ page }) => {
    await page.click('#tile-0-0');
    await page.click('#tile-0-1');
    await page.click('#tile-0-2');
    await page.click('#tile-0-3');
    await page.click('#btn-submit-word');
    await expect(page.locator('#score-display')).toHaveText('500');

    await page.click('#reset-btn');

    await expect(page.locator('#score-display')).toHaveText('0');
    await expect(page.locator('#stat2-value')).toHaveText('0 / 16');
    await expect(page.locator('#tile-0-0')).not.toHaveClass(/tile-locked/);
  });

});
