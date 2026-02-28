import type { Coord } from './Cell.ts';

export interface WordMatch {
  word: string;
  cells: Coord[];
}
