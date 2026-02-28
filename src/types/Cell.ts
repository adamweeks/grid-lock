export interface Cell {
  letter: string;
  isLocked: boolean;
  isPulsing: boolean;
}

export type Grid = Cell[][];

export interface Coord {
  r: number;
  c: number;
}
