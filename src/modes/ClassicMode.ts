import type { Grid, Coord } from '../types/Cell.ts';
import type { GameModeConfig } from '../types/GameMode.ts';
import type { IGameMode } from './IGameMode.ts';
import { WORDS } from '../data/wordList.ts';
import { initClassicGrid, pivotGrid, clearPulsing, lockCells, countLocked } from '../logic/GridEngine.ts';
import { validateSelection, canExtendSelection } from '../logic/WordDetector.ts';
import { scoreWordClassic } from '../logic/Scoring.ts';

export interface ClassicCallbacks {
  showMessage(text: string, autoDismissMs?: number): void;
  hideMessage(): void;
  syncUI(): void;
  updateWordDisplay(letters: string, canSubmit: boolean): void;
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

  constructor(private readonly cb: ClassicCallbacks) {}

  start(): void {
    this.grid = initClassicGrid();
    this.score = 0;
    this.selection = [];
    this.cb.syncUI();
    this._refreshWordDisplay();
  }

  destroy(): void {}

  onPivot(pr: number, pc: number): void {
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
      this.cb.showMessage(`"${word}" is not a valid word.`, 1500);
      this.selection = [];
      this._refreshWordDisplay();
      this.cb.syncUI();
      return;
    }

    const pts = scoreWordClassic(word);
    this.grid = lockCells(this.grid, this.selection);
    this.score += pts;
    this.selection = [];
    this._refreshWordDisplay();
    this.cb.syncUI();

    const locked = countLocked(this.grid);
    if (locked === 16) {
      this.cb.showMessage(`All tiles locked! Final score: ${this.score}`);
    } else {
      this.cb.showMessage(`+${pts} pts — "${word}" locked in!`, 2000);
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
