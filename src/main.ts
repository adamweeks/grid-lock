// @ts-nocheck
// Phase 2: imports from extracted typed modules. DOM/mode logic typed in Phases 3–5.
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
  createCell,
  getRandomLetter,
} from './logic/GridEngine.ts';
import { detectBestWord, validateSelection, canExtendSelection as _canExtendSelection } from './logic/WordDetector.ts';
import { scoreWordClassic, scoreWordBlitz, timeBonus } from './logic/Scoring.ts';

// ═══════════════════════════════════════════════════════════════════════════════
// SHARED: Grid + Pivot + Detection
// ═══════════════════════════════════════════════════════════════════════════════

let grid = [];             // grid[r][c] = { letter, isLocked, isPulsing }
let score = 0;
let pendingWord = null;    // { word, cells:[{r,c}] } — used by Blitz only
let currentMode = null;    // 'classic' | 'blitz'
let classicSelection = []; // [{r,c}, ...] — player's current tile selection (Classic only)

function makeCell(letter) { return createCell(letter); }

function initClassicGrid() { grid = _initClassicGrid(); }

function initBlitzGrid() { grid = _initBlitzGrid(); }

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
  updateUI();
  animateQuadrant(pr, pc);
}

function animateQuadrant(pr, pc) {
  [[pr,pc],[pr,pc+1],[pr+1,pc],[pr+1,pc+1]].forEach(([r,c]) => {
    const el = document.getElementById(`tile-${r}-${c}`);
    if (!el) return;
    el.classList.remove('tile-spinning');
    void el.offsetWidth;
    el.classList.add('tile-spinning');
    el.addEventListener('animationend', () => el.classList.remove('tile-spinning'), { once: true });
  });
}

// ── Word Detection ─────────────────────────────────────────────────────────────
function clearAllPulsing() { grid = clearPulsing(grid); }

// ── Classic: Manual tile selection ─────────────────────────────────────────────
function updateWordDisplay() {
  const letters = classicSelection.map(({ r, c }) => grid[r][c].letter).join(' → ');
  const display = document.getElementById('word-display');
  if (display) {
    display.textContent = letters || '— tap tiles to select —';
    display.className = letters
      ? 'w-full bg-slate-800 border border-slate-600 rounded-xl px-4 py-2 text-center text-lg font-black tracking-widest text-slate-200 min-h-[2.75rem]'
      : 'w-full bg-slate-800 border border-slate-600 rounded-xl px-4 py-2 text-center text-lg font-black tracking-widest text-slate-400 min-h-[2.75rem]';
  }
  const btn = document.getElementById('btn-submit-word');
  if (btn) {
    const canSubmit = classicSelection.length >= 3;
    btn.disabled = !canSubmit;
    btn.className = `font-black py-2 rounded-xl text-sm border transition-colors ${
      canSubmit
        ? 'bg-indigo-600 hover:bg-indigo-500 text-white border-indigo-500'
        : 'bg-indigo-800 text-indigo-400 border-indigo-700'
    }`;
    btn.style.flex = '2 1 0%';
  }
}

function canExtendSelection(r, c) {
  return _canExtendSelection(grid, classicSelection, r, c);
}

function handleClassicTileClick(r, c) {
  if (grid[r][c].isLocked) return;

  // Tap a selected tile to deselect it and everything after
  const existingIdx = classicSelection.findIndex(s => s.r === r && s.c === c);
  if (existingIdx !== -1) {
    classicSelection = classicSelection.slice(0, existingIdx);
    updateWordDisplay();
    updateUI();
    return;
  }

  if (!canExtendSelection(r, c)) return;

  classicSelection.push({ r, c });
  updateWordDisplay();
  updateUI();
}

function detectWords() {
  grid = clearPulsing(grid);
  const match = detectBestWord(grid, WORDS);
  pendingWord = match;
  if (match) {
    match.cells.forEach(({ r, c }) => { grid[r][c].isPulsing = true; });
    showMessage(`"${match.word.toUpperCase()}" detected! Tap to commit.`);
  } else {
    hideMessage();
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

  document.getElementById('stat2-label').textContent = 'Locked';
  document.getElementById('stat2-value').className = 'text-2xl font-bold text-slate-200';
  document.getElementById('stat2-value').textContent = '0 / 16';
  document.getElementById('combo-bar').classList.add('hidden');
  document.getElementById('instructions-classic').classList.remove('hidden');
  document.getElementById('instructions-blitz').classList.add('hidden');
  document.getElementById('time-add-badge').classList.add('hidden');
  document.getElementById('classic-builder').classList.remove('hidden');

  buildBoard();
  updateUI();
  updateWordDisplay();
}

function commitWordClassic() {
  if (classicSelection.length < 3) return;
  const word = classicSelection.map(({ r, c }) => grid[r][c].letter).join('');
  if (!validateSelection(grid, classicSelection, WORDS)) {
    showMessage(`"${word}" is not a valid word.`, 1500);
    classicSelection = [];
    updateWordDisplay();
    updateUI();
    return;
  }
  const pts = scoreWordClassic(word);
  grid = lockCells(grid, classicSelection);
  score += pts;
  classicSelection = [];
  updateWordDisplay();
  updateUI();
  showMessage(`+${pts} pts — "${word}" locked in!`, 2000);
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
  blitzTimeLeft  = 60;
  blitzCombo     = 1;
  blitzBestCombo = 1;
  blitzWordsFound = 0;
  pendingWord    = null;
  if (blitzInterval) clearInterval(blitzInterval);
  if (blitzComboTimer) clearTimeout(blitzComboTimer);

  initBlitzGrid();

  document.getElementById('stat2-label').textContent = 'Time';
  document.getElementById('stat2-value').textContent = '1:00';
  document.getElementById('stat2-value').className = 'text-2xl font-bold text-slate-200';
  document.getElementById('time-add-badge').classList.add('hidden');
  document.getElementById('combo-bar').classList.remove('hidden');
  document.getElementById('instructions-classic').classList.add('hidden');
  document.getElementById('instructions-blitz').classList.remove('hidden');
  document.getElementById('classic-builder').classList.add('hidden');
  updateComboBadge();

  buildBoard();
  updateUI();
  detectWords();

  blitzInterval = setInterval(tickBlitz, 1000);
}

function tickBlitz() {
  blitzTimeLeft--;
  updateTimerDisplay();
  if (blitzTimeLeft <= 0) endBlitz();
}

function updateTimerDisplay() {
  const el = document.getElementById('stat2-value');
  const mins = Math.floor(blitzTimeLeft / 60);
  const secs = blitzTimeLeft % 60;
  el.textContent = `${mins}:${secs.toString().padStart(2,'0')}`;
  if (blitzTimeLeft <= 10) {
    el.classList.add('timer-urgent');
  } else {
    el.classList.remove('timer-urgent');
  }
}

function addBlitzTime(seconds) {
  blitzTimeLeft = Math.min(blitzTimeLeft + seconds, 99);
  updateTimerDisplay();
  // Show floating +Xs badge
  const badge = document.getElementById('time-add-badge');
  badge.textContent = `+${seconds}s`;
  badge.classList.remove('hidden', 'time-badge');
  void badge.offsetWidth;
  badge.classList.add('time-badge');
  badge.addEventListener('animationend', () => badge.classList.add('hidden'), { once: true });
}

function updateComboBadge() {
  const badge = document.getElementById('combo-badge');
  badge.textContent = `x${blitzCombo}`;
  const colors = ['','','bg-orange-900 border-orange-500 text-orange-300',
                     'bg-red-900 border-red-500 text-red-300',
                     'bg-yellow-900 border-yellow-500 text-yellow-300'];
  badge.className = `font-black text-sm px-4 py-1 rounded-full border ${colors[blitzCombo] || colors[2]}`;
  badge.classList.remove('combo-pop');
  void badge.offsetWidth;
  badge.classList.add('combo-pop');
}

function advanceCombo() {
  blitzCombo = Math.min(blitzCombo + 1, 4);
  if (blitzCombo > blitzBestCombo) blitzBestCombo = blitzCombo;
  updateComboBadge();
  if (blitzComboTimer) clearTimeout(blitzComboTimer);
  blitzComboTimer = setTimeout(resetCombo, BLITZ_COMBO_WINDOW);
}

function resetCombo() {
  blitzCombo = 1;
  updateComboBadge();
}

function commitWordBlitz() {
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

  updateUI();
  showMessage(`+${earnedPts} pts${blitzCombo > 1 ? ` (x${blitzCombo} combo!)` : ''}`, 1800);

  animateTilesExit(lockedCells, () => {
    cascadeRefill(lockedCells);
  });
}

function animateTilesExit(cells, cb) {
  let done = 0;
  cells.forEach(({ r, c }) => {
    const el = document.getElementById(`tile-${r}-${c}`);
    if (!el) { done++; if (done === cells.length) cb(); return; }
    el.classList.add('tile-exiting');
    el.addEventListener('animationend', () => {
      done++;
      if (done === cells.length) cb();
    }, { once: true });
  });
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

  updateUI();

  // Animate entering tiles — one pass per affected column
  const affectedCols = [...new Set(exitedCells.map(({ c }) => c))];
  affectedCols.forEach(c => {
    for (let row = 0; row < 4; row++) {
      const el = document.getElementById(`tile-${row}-${c}`);
      if (!el) continue;
      el.classList.remove('tile-entering');
      void el.offsetWidth;
      el.classList.add('tile-entering');
      el.addEventListener('animationend', () => el.classList.remove('tile-entering'), { once: true });
    }
  });

  detectWords();
}

function endBlitz() {
  clearInterval(blitzInterval);
  if (blitzComboTimer) clearTimeout(blitzComboTimer);
  blitzInterval = null;

  document.getElementById('go-score').textContent = score.toLocaleString();
  document.getElementById('go-words').textContent = blitzWordsFound;
  document.getElementById('go-combo').textContent = `x${blitzBestCombo}`;
  document.getElementById('screen-gameover').classList.remove('hidden');
  document.getElementById('screen-gameover').style.display = 'flex';
}

// ═══════════════════════════════════════════════════════════════════════════════
// SHARED UI
// ═══════════════════════════════════════════════════════════════════════════════

function buildBoard() {
  const board = document.getElementById('game-board');
  board.innerHTML = '';
  board.style.display = 'grid';
  board.style.gridTemplateColumns = 'repeat(7, 1fr)';
  board.style.gridTemplateRows = 'repeat(7, 1fr)';
  board.style.gap = '0px';
  board.style.width = '100%';
  board.style.aspectRatio = '1 / 1';

  for (let gr = 0; gr < 7; gr++) {
    for (let gc = 0; gc < 7; gc++) {
      const isTileRow = gr % 2 === 0;
      const isTileCol = gc % 2 === 0;

      if (isTileRow && isTileCol) {
        const r = gr / 2, c = gc / 2;
        const el = document.createElement('div');
        el.id = `tile-${r}-${c}`;
        el.className = 'tile flex items-center justify-center rounded-lg m-1 font-black select-none';
        el.style.fontSize = 'clamp(1rem, 5vw, 1.75rem)';
        el.addEventListener('click', () => {
          if (currentMode === 'classic') {
            handleClassicTileClick(r, c);
          } else if (grid[r][c].isPulsing) {
            commitWordBlitz();
          }
        });
        board.appendChild(el);
      } else if (!isTileRow && !isTileCol) {
        const pr = (gr - 1) / 2, pc = (gc - 1) / 2;
        const wrapper = document.createElement('div');
        wrapper.className = 'flex items-center justify-center';
        const btn = document.createElement('button');
        btn.className = 'pivot-btn';
        btn.innerHTML = '↻';
        btn.addEventListener('click', () => pivot(pr, pc));
        wrapper.appendChild(btn);
        board.appendChild(wrapper);
      } else {
        board.appendChild(document.createElement('div'));
      }
    }
  }
}

function updateUI() {
  for (let r = 0; r < 4; r++) {
    for (let c = 0; c < 4; c++) {
      const tile = grid[r][c];
      const el = document.getElementById(`tile-${r}-${c}`);
      if (!el) continue;
      el.textContent = tile.letter;
      el.className = 'tile flex items-center justify-center rounded-lg m-1 font-black select-none';
      el.style.fontSize = 'clamp(1rem, 5vw, 1.75rem)';
      const isSelected = classicSelection.some(s => s.r === r && s.c === c);
      if (tile.isLocked) {
        el.classList.add('tile-locked', 'text-white');
        el.style.cursor = 'default';
      } else if (tile.isPulsing) {
        // Blitz only
        el.classList.add('tile-pulse', 'text-yellow-900');
        el.style.cursor = 'pointer';
      } else if (isSelected) {
        // Classic only
        el.classList.add('tile-selected');
        el.style.cursor = 'pointer';
      } else {
        el.classList.add('bg-slate-100', 'text-slate-900');
        el.style.cursor = currentMode === 'classic' ? 'pointer' : 'default';
        el.style.removeProperty('box-shadow');
      }
    }
  }

  document.getElementById('score-display').textContent = score.toLocaleString();

  if (currentMode === 'classic') {
    const locked = countLocked(grid);
    document.getElementById('stat2-value').textContent = `${locked} / 16`;
    if (locked === 16) showMessage(`All tiles locked! Final score: ${score}`, 0);
  }
}

function showMessage(text, autoDismissMs = 0) {
  const banner = document.getElementById('message-banner');
  banner.querySelector('div').textContent = text;
  banner.classList.remove('hidden');
  if (autoDismissMs > 0) setTimeout(hideMessage, autoDismissMs);
}
function hideMessage() {
  document.getElementById('message-banner').classList.add('hidden');
}

function showScreen(id) {
  ['screen-select','screen-game'].forEach(s => {
    const el = document.getElementById(s);
    if (s === id) { el.classList.remove('hidden'); el.style.display = 'flex'; }
    else          { el.classList.add('hidden'); el.style.display = 'none'; }
  });
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
  updateUI();
});

document.getElementById('btn-classic').addEventListener('click', () => {
  showScreen('screen-game');
  startClassic();
});

document.getElementById('btn-blitz').addEventListener('click', () => {
  showScreen('screen-game');
  startBlitz();
});

document.getElementById('btn-back').addEventListener('click', () => {
  if (blitzInterval) { clearInterval(blitzInterval); blitzInterval = null; }
  if (blitzComboTimer) { clearTimeout(blitzComboTimer); blitzComboTimer = null; }
  hideMessage();
  showScreen('screen-select');
});

document.getElementById('reset-btn').addEventListener('click', () => {
  if (currentMode === 'classic') startClassic();
  else startBlitz();
});

document.getElementById('go-play-again').addEventListener('click', () => {
  document.getElementById('screen-gameover').classList.add('hidden');
  document.getElementById('screen-gameover').style.display = 'none';
  startBlitz();
});

document.getElementById('go-modes').addEventListener('click', () => {
  document.getElementById('screen-gameover').classList.add('hidden');
  document.getElementById('screen-gameover').style.display = 'none';
  showScreen('screen-select');
});

// ── Init ──────────────────────────────────────────────────────────────────────
showScreen('screen-select');
