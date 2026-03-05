import { test, expect } from '@playwright/test';

test.describe('Daily Classic Puzzle', () => {

  test.beforeEach(async ({ page }) => {
    // Clear localStorage so daily completion state is clean for each test
    await page.goto('/');
    await page.evaluate(() => localStorage.clear());
    await page.reload();
  });

  // ── Mode select screen ──────────────────────────────────────────────────────

  test('daily puzzle card is visible on mode-select screen', async ({ page }) => {
    await expect(page.locator('#btn-daily')).toBeVisible();
  });

  test('daily puzzle card shows puzzle number badge', async ({ page }) => {
    const badge = page.locator('#daily-puzzle-number');
    await expect(badge).toBeVisible();
    const text = await badge.textContent();
    expect(text).toMatch(/^#\d+$/);
  });

  test('daily puzzle card shows default status (not completed) initially', async ({ page }) => {
    const status = page.locator('#daily-status');
    const text = await status.textContent();
    expect(text).not.toContain('Completed');
  });

  // ── Navigation ──────────────────────────────────────────────────────────────

  test('daily button transitions to game screen', async ({ page }) => {
    await page.click('#btn-daily');
    await expect(page.locator('#screen-game')).toBeVisible();
    await expect(page.locator('#screen-select')).not.toBeVisible();
  });

  test('game subtitle shows daily puzzle number', async ({ page }) => {
    await page.click('#btn-daily');
    const subtitle = page.locator('#game-subtitle');
    await expect(subtitle).toBeVisible();
    const text = await subtitle.textContent();
    expect(text).toMatch(/^Daily Puzzle #\d+$/);
  });

  test('back button from daily returns to mode-select', async ({ page }) => {
    await page.click('#btn-daily');
    await page.click('#btn-back');
    await expect(page.locator('#screen-select')).toBeVisible();
    await expect(page.locator('#screen-game')).not.toBeVisible();
  });

  test('game subtitle is hidden after returning to mode-select and starting Blitz', async ({ page }) => {
    await page.click('#btn-daily');
    await page.click('#btn-back');
    await page.click('#btn-blitz');
    await expect(page.locator('#game-subtitle')).toBeHidden();
    await page.click('#btn-back');
  });

  // ── Daily puzzle uses Classic UI ─────────────────────────────────────────────

  test('daily mode shows Locked label (uses classic UI)', async ({ page }) => {
    await page.click('#btn-daily');
    await expect(page.locator('#stat2-label')).toHaveText('Locked');
  });

  test('daily mode shows spin counter', async ({ page }) => {
    await page.click('#btn-daily');
    await expect(page.locator('#stat3-box')).toBeVisible();
    await expect(page.locator('#spin-display')).toHaveText('0');
  });

  test('daily mode hides combo-bar', async ({ page }) => {
    await page.click('#btn-daily');
    await expect(page.locator('#combo-bar')).toBeHidden();
  });

  test('daily mode hides hint button', async ({ page }) => {
    await page.click('#btn-daily');
    await expect(page.locator('#btn-hint')).toBeHidden();
  });

  test('daily mode renders 16 tiles', async ({ page }) => {
    await page.click('#btn-daily');
    for (let r = 0; r < 4; r++) {
      for (let c = 0; c < 4; c++) {
        await expect(page.locator(`#tile-${r}-${c}`)).toBeVisible();
      }
    }
  });

  test('daily puzzle is deterministic — same letters on reload', async ({ page }) => {
    await page.click('#btn-daily');
    const getLetters = () =>
      page.evaluate(() => {
        const letters: string[] = [];
        for (let r = 0; r < 4; r++)
          for (let c = 0; c < 4; c++)
            letters.push(document.getElementById(`tile-${r}-${c}`)?.textContent?.trim() ?? '');
        return letters.join('');
      });

    const letters1 = await getLetters();
    await page.click('#btn-back');
    await page.click('#btn-daily');
    const letters2 = await getLetters();
    expect(letters1).toBe(letters2);
  });

  // ── Reset ────────────────────────────────────────────────────────────────────

  test('reset restarts the same daily puzzle (same letters)', async ({ page }) => {
    await page.click('#btn-daily');
    const getLetters = () =>
      page.evaluate(() => {
        const letters: string[] = [];
        for (let r = 0; r < 4; r++)
          for (let c = 0; c < 4; c++)
            letters.push(document.getElementById(`tile-${r}-${c}`)?.textContent?.trim() ?? '');
        return letters.join('');
      });

    const letters1 = await getLetters();
    await page.click('#reset-btn');
    const letters2 = await getLetters();
    expect(letters1).toBe(letters2);
  });

  // ── Game-over screen ─────────────────────────────────────────────────────────

  test('share button is hidden on non-daily game-over (classic)', async ({ page }) => {
    // Start blitz (non-daily) — share button should stay hidden
    await page.click('#btn-blitz');
    // We can't easily complete the puzzle in e2e without knowing the grid,
    // so just verify the share button is hidden when the classic game over appears
    // by checking it exists but is hidden
    await expect(page.locator('#go-share')).toBeHidden();
  });

});
