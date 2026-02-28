// @ts-nocheck
// Phase 3: UI layer extracted. Mode classes and GameController added in Phase 4.
import './style.css';
import { WORDS } from './data/wordList.ts';
import {
  initClassicGrid as _initClassicGrid,
  initBlitzGrid as _initBlitzGrid,
  pivotGrid,
  clearPulsing,
  lockCells,
  countLocked,
  cascadeColumn,
} from './logic/GridEngine.ts';
import { detectBestWord, validateSelection, canExtendSelection as _canExtendSelection } from './logic/WordDetector.ts';
import { scoreWordClassic, scoreWordBlitz, timeBonus } from './logic/Scoring.ts';
import { UIController } from './ui/UIController.ts';
import { BoardRenderer } from './ui/BoardRenderer.ts';
import { AnimationPlayer } from './ui/AnimationPlayer.ts';

const uiCtrl     = new UIController();
const board      = new BoardRenderer('game-board');
const animations = new AnimationPlayer();

// ═══════════════════════════════════════════════════════════════════════════════
// SHARED: Grid + Pivot + Detection
// ═══════════════════════════════════════════════════════════════════════════════

let grid = [];             // grid[r][c] = { letter, isLocked, isPulsing }
let score = 0;
let pendingWord = null;    // { word, cells:[{r,c}] } — used by Blitz only
let currentMode = null;    // 'classic' | 'blitz'
let classicSelection = []; // [{r,c}, ...] — player's current tile selection (Classic only)

function initClassicGrid() { grid = _initClassicGrid(); }
function initBlitzGrid()   { grid = _initBlitzGrid(); }

/** Render board state + score (replaces updateUI). */
function renderBoard() {
  board.render(grid, classicSelection, currentMode === 'classic');
  uiCtrl.updateScore(score);
  if (currentMode === 'classic') {
    const locked = countLocked(grid);
    uiCtrl.updateStat2Value(`${locked} / 16`);
    if (locked === 16) uiCtrl.showMessage(`All tiles locked! Final score: ${score}`);
  }
}

// ── Tile/pivot event handlers (passed to board.build) ─────────────────────────

function onTileClick(r, c) {
  if (currentMode === 'classic') {
    handleClassicTileClick(r, c);
  } else if (grid[r][c].isPulsing) {
    commitWordBlitz();
  }
}

function onPivotClick(pr, pc) {
  pivot(pr, pc);
}

// ── Pivot ──────────────────────────────────────────────────────────────────────

function pivot(pr, pc) {
  grid = pivotGrid(grid, pr, pc);
  pendingWord = null;
  grid = clearPulsing(grid);
  if (currentMode === 'classic') {
    classicSelection = [];
    updateWordDisplay();
  } else {
    detectWords();
  }
  renderBoard();
  animations.spinQuadrant(pr, pc);
}

// ── Classic: Manual tile selection ─────────────────────────────────────────────

function updateWordDisplay() {
  const letters = classicSelection.map(({ r, c }) => grid[r][c].letter).join(' → ');
  uiCtrl.updateWordDisplay(letters, classicSelection.length >= 3);
}

function handleClassicTileClick(r, c) {
  if (grid[r][c].isLocked) return;

  // Tap a selected tile to deselect it and everything after
  const existingIdx = classicSelection.findIndex(s => s.r === r && s.c === c);
  if (existingIdx !== -1) {
    classicSelection = classicSelection.slice(0, existingIdx);
    updateWordDisplay();
    renderBoard();
    return;
  }

  if (!_canExtendSelection(grid, classicSelection, r, c)) return;

  classicSelection.push({ r, c });
  updateWordDisplay();
  renderBoard();
}

// ── Blitz: Auto word detection ─────────────────────────────────────────────────

function detectWords() {
  grid = clearPulsing(grid);
  const match = detectBestWord(grid, WORDS);
  pendingWord = match;
  if (match) {
    match.cells.forEach(({ r, c }) => { grid[r][c].isPulsing = true; });
    uiCtrl.showMessage(`"${match.word.toUpperCase()}" detected! Tap to commit.`);
  } else {
    uiCtrl.hideMessage();
  }
}

// ═══════════════════════════════════════════════════════════════════════════════
// CLASSIC MODE
// ═══════════════════════════════════════════════════════════════════════════════

function startClassic() {
  currentMode = 'classic';
  score = 0;
  pendingWord = null;
  classicSelection = [];
  initClassicGrid();

  uiCtrl.applyClassicModeUI();
  board.build(onTileClick, onPivotClick);
  renderBoard();
  updateWordDisplay();
}

function commitWordClassic() {
  if (classicSelection.length < 3) return;
  const word = classicSelection.map(({ r, c }) => grid[r][c].letter).join('');
  if (!validateSelection(grid, classicSelection, WORDS)) {
    uiCtrl.showMessage(`"${word}" is not a valid word.`, 1500);
    classicSelection = [];
    updateWordDisplay();
    renderBoard();
    return;
  }
  const pts = scoreWordClassic(word);
  grid = lockCells(grid, classicSelection);
  score += pts;
  classicSelection = [];
  updateWordDisplay();
  renderBoard();
  uiCtrl.showMessage(`+${pts} pts — "${word}" locked in!`, 2000);
}

// ═══════════════════════════════════════════════════════════════════════════════
// BLITZ MODE
// ═══════════════════════════════════════════════════════════════════════════════

let blitzTimeLeft   = 60;
let blitzInterval   = null;
let blitzCombo      = 1;
let blitzBestCombo  = 1;
let blitzComboTimer = null;
let blitzWordsFound = 0;
const BLITZ_COMBO_WINDOW = 4000; // ms to extend combo

function startBlitz() {
  currentMode = 'blitz';
  score = 0;
  blitzTimeLeft   = 60;
  blitzCombo      = 1;
  blitzBestCombo  = 1;
  blitzWordsFound = 0;
  pendingWord     = null;
  if (blitzInterval)   clearInterval(blitzInterval);
  if (blitzComboTimer) clearTimeout(blitzComboTimer);

  initBlitzGrid();

  uiCtrl.applyBlitzModeUI();
  uiCtrl.updateComboBadge(blitzCombo);
  board.build(onTileClick, onPivotClick);
  renderBoard();
  detectWords();

  blitzInterval = setInterval(tickBlitz, 1000);
}

function tickBlitz() {
  blitzTimeLeft--;
  uiCtrl.updateTimerDisplay(blitzTimeLeft);
  if (blitzTimeLeft <= 0) endBlitz();
}

function addBlitzTime(seconds) {
  blitzTimeLeft = Math.min(blitzTimeLeft + seconds, 99);
  uiCtrl.updateTimerDisplay(blitzTimeLeft);
  uiCtrl.showTimeAddBadge(seconds);
}

function advanceCombo() {
  blitzCombo = Math.min(blitzCombo + 1, 4);
  if (blitzCombo > blitzBestCombo) blitzBestCombo = blitzCombo;
  uiCtrl.updateComboBadge(blitzCombo);
  if (blitzComboTimer) clearTimeout(blitzComboTimer);
  blitzComboTimer = setTimeout(resetCombo, BLITZ_COMBO_WINDOW);
}

function resetCombo() {
  blitzCombo = 1;
  uiCtrl.updateComboBadge(blitzCombo);
}

async function commitWordBlitz() {
  if (!pendingWord) return;
  const earnedPts = scoreWordBlitz(pendingWord.word, blitzCombo);
  const addedTime = timeBonus(pendingWord.word);

  const lockedCells = [...pendingWord.cells];
  grid = clearPulsing(grid);

  score += earnedPts;
  blitzWordsFound++;
  pendingWord = null;
  addBlitzTime(addedTime);
  advanceCombo();

  renderBoard();
  uiCtrl.showMessage(`+${earnedPts} pts${blitzCombo > 1 ? ` (x${blitzCombo} combo!)` : ''}`, 1800);

  await animations.exitTiles(lockedCells);
  cascadeRefill(lockedCells);
}

function cascadeRefill(exitedCells) {
  // Group exited rows by column
  const byCol = {};
  exitedCells.forEach(({ r, c }) => {
    if (!byCol[c]) byCol[c] = [];
    byCol[c].push(r);
  });

  // Use GridEngine.cascadeColumn for each affected column
  Object.entries(byCol).forEach(([colStr, rows]) => {
    grid = cascadeColumn(grid, +colStr, rows);
  });

  renderBoard();

  const affectedCols = [...new Set(exitedCells.map(({ c }) => c))];
  animations.enterColumns(affectedCols);

  detectWords();
}

function endBlitz() {
  clearInterval(blitzInterval);
  if (blitzComboTimer) clearTimeout(blitzComboTimer);
  blitzInterval = null;
  uiCtrl.showGameOver(score, blitzWordsFound, blitzBestCombo);
}

// ═══════════════════════════════════════════════════════════════════════════════
// EVENT WIRING
// ═══════════════════════════════════════════════════════════════════════════════

document.getElementById('btn-submit-word').addEventListener('click', () => {
  if (currentMode === 'classic') commitWordClassic();
});

document.getElementById('btn-clear-selection').addEventListener('click', () => {
  classicSelection = [];
  updateWordDisplay();
  renderBoard();
});

document.getElementById('btn-classic').addEventListener('click', () => {
  uiCtrl.showScreen('screen-game');
  startClassic();
});

document.getElementById('btn-blitz').addEventListener('click', () => {
  uiCtrl.showScreen('screen-game');
  startBlitz();
});

document.getElementById('btn-back').addEventListener('click', () => {
  if (blitzInterval)   { clearInterval(blitzInterval);  blitzInterval   = null; }
  if (blitzComboTimer) { clearTimeout(blitzComboTimer); blitzComboTimer = null; }
  uiCtrl.hideMessage();
  uiCtrl.showScreen('screen-select');
});

document.getElementById('reset-btn').addEventListener('click', () => {
  if (currentMode === 'classic') startClassic();
  else startBlitz();
});

document.getElementById('go-play-again').addEventListener('click', () => {
  uiCtrl.hideGameOver();
  startBlitz();
});

document.getElementById('go-modes').addEventListener('click', () => {
  uiCtrl.hideGameOver();
  uiCtrl.showScreen('screen-select');
});

// ── Init ──────────────────────────────────────────────────────────────────────
uiCtrl.showScreen('screen-select');
