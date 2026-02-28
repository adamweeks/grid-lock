import type { Grid, Coord } from '../types/Cell.ts';
import type { GameModeConfig } from '../types/GameMode.ts';

export interface IGameMode {
  readonly config: GameModeConfig;
  start(): void;
  destroy(): void;
  onPivot(pr: number, pc: number): void;
  onTileClick(r: number, c: number): void;
  onCommit(): void | Promise<void>;
  onClearSelection(): void;
  getGrid(): Grid;
  getScore(): number;
  getStat2Value(): string;
  getSelection(): Coord[];
}
