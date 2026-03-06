import type { Grid, Coord } from '../types/Cell.ts';
import type { GameModeConfig } from '../types/GameMode.ts';
import type { IGameMode } from './IGameMode.ts';
import { WORDS } from '../data/wordList.ts';
import { initClassicGrid, pivotGrid, clearPulsing, lockCells, countLocked, hasMovesRemaining } from '../logic/GridEngine.ts';
import { validateSelection, canExtendSelection } from '../logic/WordDetector.ts';
import { scoreWordClassic } from '../logic/Scoring.ts';

export interface ClassicCallbacks {
  showMessage(text: string, autoDismissMs?: number): void;
  hideMessage(): void;
  syncUI(): void;
  updateWordDisplay(letters: string, canSubmit: boolean): void;
  showScoreNotification(text: string, durationMs?: number, isError?: boolean): void;
  /** allLocked = true when all 16 tiles are locked; false when no more words remain. */
  onGameComplete(score: number, wordsFound: number, spins: number, allLocked: boolean): void;
  updateSpinDisplay(spins: number): void;
}

export class ClassicMode implements IGameMode {
  readonly config: GameModeConfig = {
    id: 'classic',
    stat2Label: 'Locked',
    stat2InitialValue: '0 / 16',
    showComboBar: false,
    showClassicBuilder: true,
    instructionsVariant: 'classic',
  };

  private grid!: Grid;
  private score = 0;
  private selection: Coord[] = [];
  private spinCount = 0;
  private wordsFound = 0;

  constructor(
    private readonly cb: ClassicCallbacks,
    private readonly initialGrid?: Grid,
  ) {}

  start(): void {
    this.grid = this.initialGrid
      ? this.initialGrid.map(row => row.map(cell => ({ ...cell })))
      : initClassicGrid();
    this.score = 0;
    this.selection = [];
    this.spinCount = 0;
    this.wordsFound = 0;
    this.cb.syncUI();
    this.cb.updateSpinDisplay(0);
    this._refreshWordDisplay();
  }

  destroy(): void {}

  onPivot(pr: number, pc: number): void {
    this.spinCount++;
    this.cb.updateSpinDisplay(this.spinCount);
    this.grid = pivotGrid(this.grid, pr, pc);
    this.grid = clearPulsing(this.grid);
    this.selection = [];
    this._refreshWordDisplay();
    this.cb.syncUI();
  }

  onTileClick(r: number, c: number): void {
    if (this.grid[r][c].isLocked) return;

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

  onCommit(): void {
    if (this.selection.length < 3) return;
    const word = this.selection.map(({ r, c }) => this.grid[r][c].letter).join('');

    if (!validateSelection(this.grid, this.selection, WORDS)) {
      this.cb.showScoreNotification(`"${word}" is not a valid word`, 1500, true);
      this.selection = [];
      this.cb.syncUI();
      return;
    }

    const pts = scoreWordClassic(word);
    this.grid = lockCells(this.grid, this.selection);
    this.score += pts;
    this.wordsFound++;
    this.selection = [];
    this._refreshWordDisplay();
    this.cb.syncUI();

    const locked = countLocked(this.grid);
    const allLocked = locked === 16;
    const hasMoreWords = allLocked ? false : hasMovesRemaining(this.grid, WORDS);
    if (allLocked || !hasMoreWords) {
      this.cb.onGameComplete(this.score, this.wordsFound, this.spinCount, allLocked);
    } else {
      this.cb.showScoreNotification(`+${pts} pts — "${word}" locked in!`, 2000);
    }
  }

  onClearSelection(): void {
    this.selection = [];
    this._refreshWordDisplay();
    this.cb.syncUI();
  }

  getGrid(): Grid      { return this.grid; }
  getScore(): number  { return this.score; }
  getSelection(): Coord[] { return this.selection; }

  getStat2Value(): string {
    return `${countLocked(this.grid)} / 16`;
  }

  private _refreshWordDisplay(): void {
    const letters = this.selection.map(({ r, c }) => this.grid[r][c].letter).join(' → ');
    this.cb.updateWordDisplay(letters, this.selection.length >= 3);
  }
}
