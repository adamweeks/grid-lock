import type { Cell, Grid, Coord } from '../types/Cell.ts';
import { INITIAL_LETTERS, LETTER_POOL } from '../data/wordList.ts';

export function createCell(letter: string): Cell {
  return { letter, isLocked: false, isPulsing: false };
}

export function getRandomLetter(): string {
  return LETTER_POOL[Math.floor(Math.random() * LETTER_POOL.length)];
}

export function initClassicGrid(): Grid {
  return INITIAL_LETTERS.map(row => row.map(createCell));
}

export function initBlitzGrid(): Grid {
  return Array.from({ length: 4 }, () =>
    Array.from({ length: 4 }, () => createCell(getRandomLetter()))
  );
}

/**
 * Rotates the 2×2 quadrant at (pr, pc) clockwise.
 * Returns a NEW grid — does not mutate the input.
 */
export function pivotGrid(grid: Grid, pr: number, pc: number): Grid {
  const next: Grid = grid.map(row => row.map(cell => ({ ...cell })));
  next[pr][pc + 1]     = { ...grid[pr][pc] };
  next[pr + 1][pc + 1] = { ...grid[pr][pc + 1] };
  next[pr + 1][pc]     = { ...grid[pr + 1][pc + 1] };
  next[pr][pc]         = { ...grid[pr + 1][pc] };
  return next;
}

/** Returns a new grid with isPulsing cleared on all cells. */
export function clearPulsing(grid: Grid): Grid {
  return grid.map(row =>
    row.map(cell => cell.isPulsing ? { ...cell, isPulsing: false } : cell)
  );
}

/** Returns a new grid with the given cells marked as locked. */
export function lockCells(grid: Grid, coords: Coord[]): Grid {
  const next: Grid = grid.map(row => row.map(cell => ({ ...cell })));
  coords.forEach(({ r, c }) => { next[r][c].isLocked = true; });
  return next;
}

/** Counts locked cells in the grid. */
export function countLocked(grid: Grid): number {
  return grid.flat().filter(c => c.isLocked).length;
}

/**
 * Rebuilds a column after Blitz cascade.
 * Removes the exited rows, shifts remaining cells down, fills the top with
 * new random letters. Returns a NEW grid.
 */
export function cascadeColumn(grid: Grid, col: number, exitedRows: number[]): Grid {
  const next: Grid = grid.map(row => row.map(cell => ({ ...cell })));
  const kept = [];
  for (let r = 0; r < 4; r++) {
    if (!exitedRows.includes(r)) kept.push({ ...grid[r][col] });
  }
  const newLetters = exitedRows.map(() => createCell(getRandomLetter()));
  const newCol = [...newLetters, ...kept];
  for (let r = 0; r < 4; r++) {
    next[r][col] = { ...newCol[r], isLocked: false, isPulsing: false };
  }
  return next;
}
