import type { Grid, Coord } from '../types/Cell.ts';
import type { GameModeConfig } from '../types/GameMode.ts';
import type { IGameMode } from './IGameMode.ts';
import { WORDS } from '../data/wordList.ts';
import { initBlitzGrid, pivotGrid, clearPulsing, cascadeColumn } from '../logic/GridEngine.ts';
import { detectBestWord } from '../logic/WordDetector.ts';
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
}

const COMBO_WINDOW = 4000;
const MAX_COMBO    = 4;
const MAX_TIME     = 99;

export class BlitzMode implements IGameMode {
  readonly config: GameModeConfig = {
    id: 'blitz',
    stat2Label: 'Time',
    stat2InitialValue: '1:00',
    showComboBar: true,
    showClassicBuilder: false,
    instructionsVariant: 'blitz',
  };

  private grid!: Grid;
  private score = 0;
  private timeLeft = 60;
  private combo = 1;
  private bestCombo = 1;
  private wordsFound = 0;
  private pendingWord: { word: string; cells: Coord[] } | null = null;
  private interval: ReturnType<typeof setInterval> | null = null;
  private comboTimer: ReturnType<typeof setTimeout> | null = null;

  constructor(private readonly cb: BlitzCallbacks) {}

  start(): void {
    this.grid       = initBlitzGrid();
    this.score      = 0;
    this.timeLeft   = 60;
    this.combo      = 1;
    this.bestCombo  = 1;
    this.wordsFound = 0;
    this.pendingWord = null;
    this.cb.updateComboBadge(this.combo);
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
    this.grid = pivotGrid(this.grid, pr, pc);
    this.pendingWord = null;
    this.grid = clearPulsing(this.grid);
    this._detectWords();
    this.cb.syncUI();
  }

  onTileClick(r: number, c: number): void {
    if (this.grid[r][c].isPulsing) void this.onCommit();
  }

  async onCommit(): Promise<void> {
    if (!this.pendingWord) return;

    const earnedPts  = scoreWordBlitz(this.pendingWord.word, this.combo);
    const addedTime  = timeBonus(this.pendingWord.word);
    const lockedCells = [...this.pendingWord.cells];

    this.grid = clearPulsing(this.grid);
    this.score += earnedPts;
    this.wordsFound++;
    this.pendingWord = null;

    this._addTime(addedTime);
    this._advanceCombo();

    this.cb.syncUI();
    this.cb.showMessage(
      `+${earnedPts} pts${this.combo > 1 ? ` (x${this.combo} combo!)` : ''}`,
      1800,
    );

    await this.cb.exitTiles(lockedCells);
    this._cascadeRefill(lockedCells);
  }

  onClearSelection(): void { /* no-op in Blitz */ }

  getGrid(): Grid        { return this.grid; }
  getScore(): number     { return this.score; }
  getSelection(): Coord[] { return []; }

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
    this.grid = clearPulsing(this.grid);
    const match = detectBestWord(this.grid, WORDS);
    this.pendingWord = match;
    if (match) {
      match.cells.forEach(({ r, c }) => { this.grid[r][c].isPulsing = true; });
      this.cb.showMessage(`"${match.word.toUpperCase()}" detected! Tap to commit.`);
    } else {
      this.cb.hideMessage();
    }
  }

  private _endGame(): void {
    this.destroy();
    this.cb.onGameOver(this.score, this.wordsFound, this.bestCombo);
  }
}
