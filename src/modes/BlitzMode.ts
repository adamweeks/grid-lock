import type { Grid, Coord } from '../types/Cell.ts';
import type { GameModeConfig } from '../types/GameMode.ts';
import type { IGameMode } from './IGameMode.ts';
import { WORDS } from '../data/wordList.ts';
import { initBlitzGrid, pivotGrid, clearPulsing, cascadeColumn } from '../logic/GridEngine.ts';
import { detectBestWord, canExtendSelection, validateSelection } from '../logic/WordDetector.ts';
import { scoreWordBlitz, timeBonus } from '../logic/Scoring.ts';

export interface BlitzCallbacks {
  showMessage(text: string, autoDismissMs?: number): void;
  hideMessage(): void;
  syncUI(): void;
  updateTimerDisplay(timeLeft: number): void;
  showTimeAddBadge(seconds: number): void;
  updateComboBadge(combo: number): void;
  exitTiles(cells: Coord[]): Promise<void>;
  enterColumns(cols: number[]): void;
  onGameOver(score: number, wordsFound: number, bestCombo: number): void;
  updateWordDisplay(letters: string, canSubmit: boolean): void;
  setHintAvailable(available: boolean): void;
}

const COMBO_WINDOW = 4000;
const MAX_COMBO    = 4;
const MAX_TIME     = 99;
const HINT_COST    = 5;

export class BlitzMode implements IGameMode {
  readonly config: GameModeConfig = {
    id: 'blitz',
    stat2Label: 'Time',
    stat2InitialValue: '1:00',
    showComboBar: true,
    showClassicBuilder: true,
    instructionsVariant: 'blitz',
  };

  private grid!: Grid;
  private score = 0;
  private timeLeft = 60;
  private combo = 1;
  private bestCombo = 1;
  private wordsFound = 0;
  private pendingWord: { word: string; cells: Coord[] } | null = null;
  private selection: Coord[] = [];
  private isCommitting = false;
  private interval: ReturnType<typeof setInterval> | null = null;
  private comboTimer: ReturnType<typeof setTimeout> | null = null;

  constructor(private readonly cb: BlitzCallbacks) {}

  start(): void {
    this.grid        = initBlitzGrid();
    this.score       = 0;
    this.timeLeft    = 60;
    this.combo       = 1;
    this.bestCombo   = 1;
    this.wordsFound  = 0;
    this.pendingWord  = null;
    this.selection    = [];
    this.isCommitting = false;
    this.cb.updateComboBadge(this.combo);
    this.cb.updateWordDisplay('', false);
    this.cb.syncUI();
    this._detectWords();
    this.interval = setInterval(() => this._tick(), 1000);
  }

  destroy(): void {
    if (this.interval)   clearInterval(this.interval);
    if (this.comboTimer) clearTimeout(this.comboTimer);
    this.interval   = null;
    this.comboTimer = null;
  }

  onPivot(pr: number, pc: number): void {
    if (this.isCommitting) return;
    this.grid = pivotGrid(this.grid, pr, pc);
    this.pendingWord = null;
    this.selection = [];
    this.cb.updateWordDisplay('', false);
    this._detectWords();
    this.cb.syncUI();
  }

  onTileClick(r: number, c: number): void {
    if (this.isCommitting) return;
    const existingIdx = this.selection.findIndex(s => s.r === r && s.c === c);
    if (existingIdx !== -1) {
      this.selection = this.selection.slice(0, existingIdx);
      this._refreshWordDisplay();
      this.cb.syncUI();
      return;
    }

    if (!canExtendSelection(this.grid, this.selection, r, c)) return;

    this.selection = [...this.selection, { r, c }];
    this._refreshWordDisplay();
    this.cb.syncUI();
  }

  onHint(): void {
    if (this.isCommitting || !this.pendingWord) return;

    this.timeLeft = Math.max(0, this.timeLeft - HINT_COST);
    this.cb.updateTimerDisplay(this.timeLeft);
    this.cb.showMessage(`Hint! -${HINT_COST}s`, 1200);

    this.selection = [...this.pendingWord.cells];
    this._refreshWordDisplay();
    this.cb.syncUI();

    if (this.timeLeft <= 0) this._endGame();
  }

  async onCommit(): Promise<void> {
    if (this.isCommitting || this.selection.length < 3) return;
    const word = this.selection.map(({ r, c }) => this.grid[r][c].letter).join('');

    if (!validateSelection(this.grid, this.selection, WORDS)) {
      this.cb.showMessage(`"${word}" is not a valid word.`, 1500);
      this.selection = [];
      this._refreshWordDisplay();
      this.cb.syncUI();
      return;
    }

    this.isCommitting = true;
    const committedCells = [...this.selection];
    const usedCombo = this.combo;
    const earnedPts = scoreWordBlitz(word, usedCombo);
    const addedTime = timeBonus(word);

    this.grid = clearPulsing(this.grid);
    this.score += earnedPts;
    this.wordsFound++;
    this.pendingWord = null;
    this.selection = [];
    this._refreshWordDisplay();

    this._addTime(addedTime);
    this._advanceCombo();

    this.cb.syncUI();
    this.cb.showMessage(
      `+${earnedPts} pts${usedCombo > 1 ? ` (x${usedCombo} combo!)` : ''}`,
      1800,
    );

    try {
      await this.cb.exitTiles(committedCells);
      this._cascadeRefill(committedCells);
    } finally {
      this.isCommitting = false;
    }
  }

  onClearSelection(): void {
    this.selection = [];
    this.grid = clearPulsing(this.grid);
    this._refreshWordDisplay();
    this.cb.syncUI();
  }

  getGrid(): Grid        { return this.grid; }
  getScore(): number     { return this.score; }
  getSelection(): Coord[] { return this.selection; }

  getStat2Value(): string {
    const mins = Math.floor(this.timeLeft / 60);
    const secs = this.timeLeft % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  }

  private _tick(): void {
    this.timeLeft--;
    this.cb.updateTimerDisplay(this.timeLeft);
    if (this.timeLeft <= 0) this._endGame();
  }

  private _addTime(seconds: number): void {
    this.timeLeft = Math.min(this.timeLeft + seconds, MAX_TIME);
    this.cb.updateTimerDisplay(this.timeLeft);
    this.cb.showTimeAddBadge(seconds);
  }

  private _advanceCombo(): void {
    this.combo = Math.min(this.combo + 1, MAX_COMBO);
    if (this.combo > this.bestCombo) this.bestCombo = this.combo;
    this.cb.updateComboBadge(this.combo);
    if (this.comboTimer) clearTimeout(this.comboTimer);
    this.comboTimer = setTimeout(() => this._resetCombo(), COMBO_WINDOW);
  }

  private _resetCombo(): void {
    this.combo = 1;
    this.cb.updateComboBadge(this.combo);
  }

  private _cascadeRefill(exitedCells: Coord[]): void {
    const byCol: Record<number, number[]> = {};
    exitedCells.forEach(({ r, c }) => {
      if (!byCol[c]) byCol[c] = [];
      byCol[c].push(r);
    });
    Object.entries(byCol).forEach(([col, rows]) => {
      this.grid = cascadeColumn(this.grid, +col, rows);
    });

    this.cb.syncUI();
    const affectedCols = [...new Set(exitedCells.map(({ c }) => c))];
    this.cb.enterColumns(affectedCols);
    this._detectWords();
  }

  private _detectWords(): void {
    const match = detectBestWord(this.grid, WORDS);
    this.pendingWord = match;
    this.cb.setHintAvailable(match !== null);
  }

  private _refreshWordDisplay(): void {
    const letters = this.selection.map(({ r, c }) => this.grid[r][c].letter).join(' → ');
    this.cb.updateWordDisplay(letters, this.selection.length >= 3);
  }

  private _endGame(): void {
    this.destroy();
    this.cb.onGameOver(this.score, this.wordsFound, this.bestCombo);
  }
}
