// @ts-nocheck
// Phase 4: main.ts is event wiring only. All game logic lives in GameController + modes.
import './style.css';
import { UIController }   from './ui/UIController.ts';
import { BoardRenderer }  from './ui/BoardRenderer.ts';
import { AnimationPlayer } from './ui/AnimationPlayer.ts';
import { GameController } from './app/GameController.ts';

const uiCtrl     = new UIController();
const board      = new BoardRenderer('game-board');
const animations = new AnimationPlayer();
const ctrl       = new GameController(uiCtrl, board, animations);

// ── Mode selection ────────────────────────────────────────────────────────────

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

document.getElementById('go-play-again').addEventListener('click', () => {
  uiCtrl.hideGameOver();
  ctrl.reset();
});

document.getElementById('go-modes').addEventListener('click', () => {
  uiCtrl.hideGameOver();
  uiCtrl.showScreen('screen-select');
});

// ── Init ──────────────────────────────────────────────────────────────────────
uiCtrl.showScreen('screen-select');
