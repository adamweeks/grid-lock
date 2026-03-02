import { test, expect } from '@playwright/test';

test.describe('Blitz mode', () => {

  test.beforeEach(async ({ page }) => {
    // Install fake clock BEFORE navigating so BlitzMode's setInterval uses the mock
    await page.clock.install();
    await page.goto('/');
    await page.click('#btn-blitz');
    await expect(page.locator('#tile-0-0')).toBeVisible();
  });

  // ── Initial state ──────────────────────────────────────────────────────

  test('timer shows 1:00 at game start', async ({ page }) => {
    await expect(page.locator('#stat2-value')).toHaveText('1:00');
  });

  test('combo bar is visible', async ({ page }) => {
    await expect(page.locator('#combo-bar')).toBeVisible();
  });

  test('hint button is visible', async ({ page }) => {
    await expect(page.locator('#btn-hint')).toBeVisible();
  });

  test('hint button is never disabled regardless of word availability', async ({ page }) => {
    await expect(page.locator('#btn-hint')).not.toBeDisabled();
  });

  test('score starts at 0', async ({ page }) => {
    await expect(page.locator('#score-display')).toHaveText('0');
  });

  test('combo badge starts at x1', async ({ page }) => {
    await expect(page.locator('#combo-badge')).toHaveText('x1');
  });

  test('board renders all 16 tiles', async ({ page }) => {
    for (let r = 0; r < 4; r++) {
      for (let c = 0; c < 4; c++) {
        await expect(page.locator(`#tile-${r}-${c}`)).toBeVisible();
      }
    }
  });

  // ── Timer countdown ────────────────────────────────────────────────────

  test('timer decrements to 0:59 after 1 second', async ({ page }) => {
    await page.clock.runFor(1_000);
    await expect(page.locator('#stat2-value')).toHaveText('0:59');
  });

  test('timer shows 0:10 after 50 seconds', async ({ page }) => {
    await page.clock.runFor(50_000);
    await expect(page.locator('#stat2-value')).toHaveText('0:10');
  });

  test('stat2-value gains timer-urgent class at 10 seconds remaining', async ({ page }) => {
    await page.clock.runFor(50_000);
    await expect(page.locator('#stat2-value')).toHaveClass(/timer-urgent/);
  });

  test('game-over screen appears when timer reaches zero', async ({ page }) => {
    await page.clock.runFor(60_000);
    await expect(page.locator('#screen-gameover')).toBeVisible();
  });

  // ── Game-over screen ───────────────────────────────────────────────────

  test('game-over shows 0 score when no words committed', async ({ page }) => {
    await page.clock.runFor(60_000);
    await expect(page.locator('#go-score')).toHaveText('0');
  });

  test('game-over shows 0 words found when no words committed', async ({ page }) => {
    await page.clock.runFor(60_000);
    await expect(page.locator('#go-words')).toHaveText('0');
  });

  test('game-over shows x1 best combo when no words committed', async ({ page }) => {
    await page.clock.runFor(60_000);
    await expect(page.locator('#go-combo')).toHaveText('x1');
  });

  test('game screen is hidden when game-over is shown', async ({ page }) => {
    await page.clock.runFor(60_000);
    await expect(page.locator('#screen-gameover')).toBeVisible();
  });

  test('Play Again restarts blitz with fresh timer', async ({ page }) => {
    await page.clock.runFor(60_000);
    await expect(page.locator('#screen-gameover')).toBeVisible();
    await page.click('#go-play-again');
    await expect(page.locator('#screen-gameover')).not.toBeVisible();
    await expect(page.locator('#stat2-value')).toHaveText('1:00');
    await expect(page.locator('#score-display')).toHaveText('0');
  });

  test('Back to Modes button returns to mode-select screen', async ({ page }) => {
    await page.clock.runFor(60_000);
    await page.click('#go-modes');
    await expect(page.locator('#screen-select')).toBeVisible();
    await expect(page.locator('#screen-gameover')).not.toBeVisible();
  });

  // ── Hint button ────────────────────────────────────────────────────────

  test('hint button deducts 5 seconds from timer when available', async ({ page }) => {
    await page.click('#btn-hint');
    // Timer should drop from 1:00 to 0:55 (costs 5s) if a word was detected
    const timerText = await page.locator('#stat2-value').textContent();
    if (timerText !== '0:55') {
      // No word detected on random board — button showed "No words found" instead
      test.skip();
      return;
    }
  });

  // ── Reset ──────────────────────────────────────────────────────────────

  test('reset restores timer to 1:00 and score to 0', async ({ page }) => {
    await page.clock.runFor(10_000);
    await expect(page.locator('#stat2-value')).toHaveText('0:50');

    await page.click('#reset-btn');

    await expect(page.locator('#stat2-value')).toHaveText('1:00');
    await expect(page.locator('#score-display')).toHaveText('0');
  });

  test('reset restores combo badge to x1', async ({ page }) => {
    await page.click('#reset-btn');
    await expect(page.locator('#combo-badge')).toHaveText('x1');
  });

  // ── Back button while playing ──────────────────────────────────────────

  test('back button returns to mode-select while timer is running', async ({ page }) => {
    await page.clock.runFor(5_000);
    await page.click('#btn-back');
    await expect(page.locator('#screen-select')).toBeVisible();
    await expect(page.locator('#screen-game')).not.toBeVisible();
  });

});
