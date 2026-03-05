import { test, expect } from '@playwright/test';

test.describe('Navigation', () => {

  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('shows mode-select screen on load', async ({ page }) => {
    await expect(page.locator('#screen-select')).toBeVisible();
    await expect(page.locator('#screen-game')).not.toBeVisible();
    await expect(page.locator('#screen-gameover')).not.toBeVisible();
  });

  test('Daily Puzzle button transitions to game screen', async ({ page }) => {
    await page.click('#btn-daily');
    await expect(page.locator('#screen-game')).toBeVisible();
    await expect(page.locator('#screen-select')).not.toBeVisible();
  });

  test('Blitz button transitions to game screen', async ({ page }) => {
    await page.click('#btn-blitz');
    await expect(page.locator('#screen-game')).toBeVisible();
    await expect(page.locator('#screen-select')).not.toBeVisible();
    await page.click('#btn-back');
  });

  test('Back button returns to mode-select screen', async ({ page }) => {
    await page.click('#btn-daily');
    await page.click('#btn-back');
    await expect(page.locator('#screen-select')).toBeVisible();
    await expect(page.locator('#screen-game')).not.toBeVisible();
  });

  test('Reset button keeps game screen visible', async ({ page }) => {
    await page.click('#btn-daily');
    await page.click('#reset-btn');
    await expect(page.locator('#screen-game')).toBeVisible();
    await expect(page.locator('#screen-select')).not.toBeVisible();
  });

  test('Daily mode shows Locked label', async ({ page }) => {
    await page.click('#btn-daily');
    await expect(page.locator('#stat2-label')).toHaveText('Locked');
  });

  test('Blitz mode shows Time label', async ({ page }) => {
    await page.click('#btn-blitz');
    await expect(page.locator('#stat2-label')).toHaveText('Time');
    await page.click('#btn-back');
  });

  test('Daily mode hides combo-bar', async ({ page }) => {
    await page.click('#btn-daily');
    await expect(page.locator('#combo-bar')).toBeHidden();
  });

  test('Blitz mode shows combo-bar', async ({ page }) => {
    await page.click('#btn-blitz');
    await expect(page.locator('#combo-bar')).toBeVisible();
    await page.click('#btn-back');
  });

  test('Daily mode hides hint button', async ({ page }) => {
    await page.click('#btn-daily');
    await expect(page.locator('#btn-hint')).toBeHidden();
  });

  test('Blitz mode shows hint button', async ({ page }) => {
    await page.click('#btn-blitz');
    await expect(page.locator('#btn-hint')).toBeVisible();
    await page.click('#btn-back');
  });

});
