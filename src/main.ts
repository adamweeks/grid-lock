// @ts-nocheck
// Phase 4: main.ts is event wiring only. All game logic lives in GameController + modes.
import './style.css';
import { UIController }   from './ui/UIController.ts';
import { BoardRenderer }  from './ui/BoardRenderer.ts';
import { AnimationPlayer } from './ui/AnimationPlayer.ts';
import { GameController } from './app/GameController.ts';
import { getTodaysPuzzle, todayDateStr, getDayIndex, loadDailyResult } from './logic/DailyPuzzle.ts';

const uiCtrl     = new UIController();
const board      = new BoardRenderer('game-board');
const animations = new AnimationPlayer();
const ctrl       = new GameController(uiCtrl, board, animations);

// ── Daily puzzle card setup ────────────────────────────────────────────────────

(function initDailyCard() {
  const dateStr     = todayDateStr();
  const puzzleNum   = getDayIndex(dateStr);
  const numEl       = document.getElementById('daily-puzzle-number');
  const statusEl    = document.getElementById('daily-status');

  if (numEl) numEl.textContent = `#${puzzleNum}`;

  const saved = loadDailyResult(dateStr);
  if (saved && statusEl) {
    statusEl.textContent = `✅ Completed — ${saved.score.toLocaleString()} pts`;
    statusEl.classList.remove('text-slate-500');
    statusEl.classList.add('text-emerald-400', 'font-semibold');
  }
})();

// ── Mode selection ────────────────────────────────────────────────────────────

document.getElementById('btn-daily').addEventListener('click', () => {
  uiCtrl.showScreen('screen-game');
  ctrl.startDailyClassic(getTodaysPuzzle());
});

document.getElementById('btn-classic').addEventListener('click', () => {
  uiCtrl.showScreen('screen-game');
  ctrl.startClassic();
});

document.getElementById('btn-blitz').addEventListener('click', () => {
  uiCtrl.showScreen('screen-game');
  ctrl.startBlitz();
});

// ── In-game controls ──────────────────────────────────────────────────────────

document.getElementById('btn-submit-word').addEventListener('click', () => ctrl.commit());
document.getElementById('btn-clear-selection').addEventListener('click', () => ctrl.clearSelection());
document.getElementById('btn-hint').addEventListener('click', () => ctrl.hint());
document.getElementById('reset-btn').addEventListener('click', () => ctrl.reset());

document.getElementById('btn-back').addEventListener('click', () => {
  ctrl.teardown();
  uiCtrl.hideMessage();
  uiCtrl.showScreen('screen-select');
});

// ── Game over screen ──────────────────────────────────────────────────────────

document.getElementById('go-share').addEventListener('click', async () => {
  const btn = document.getElementById('go-share');
  await uiCtrl.copyShareText();
  if (btn) {
    const original = btn.textContent;
    btn.textContent = '✅ Copied!';
    setTimeout(() => { btn.textContent = original; }, 2000);
  }
});

document.getElementById('go-play-again').addEventListener('click', () => {
  uiCtrl.hideGameOver();
  ctrl.reset();
});

document.getElementById('go-modes').addEventListener('click', () => {
  uiCtrl.hideGameOver();
  ctrl.teardown();
  uiCtrl.showScreen('screen-select');

  // Refresh daily card status in case player just completed the daily puzzle
  const dateStr  = todayDateStr();
  const statusEl = document.getElementById('daily-status');
  const saved    = loadDailyResult(dateStr);
  if (saved && statusEl && !statusEl.classList.contains('text-emerald-400')) {
    statusEl.textContent = `✅ Completed — ${saved.score.toLocaleString()} pts`;
    statusEl.classList.remove('text-slate-500');
    statusEl.classList.add('text-emerald-400', 'font-semibold');
  }
});

// ── Init ──────────────────────────────────────────────────────────────────────
uiCtrl.showScreen('screen-select');
