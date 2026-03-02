import type { Cell, Grid, Coord } from '../types/Cell.ts';
import { INITIAL_LETTERS, LETTER_POOL } from '../data/wordList.ts';
import { detectBestWord } from './WordDetector.ts';

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
 * Replaces committed Blitz cells with new random letters at their original positions.
 * Returns a NEW grid — does not mutate the input.
 */
export function refillCells(grid: Grid, cells: Coord[]): Grid {
  const next: Grid = grid.map(row => row.map(cell => ({ ...cell })));
  cells.forEach(({ r, c }) => {
    next[r][c] = createCell(getRandomLetter());
  });
  return next;
}

/**
 * Guarantees at least one valid word exists in the grid (row or column scan).
 * If the grid already has a detectable word, returns it unchanged.
 * Otherwise, places a random word from `words` into a random row or column.
 * Returns a NEW grid — does not mutate the input.
 */
export function ensurePlayable(grid: Grid, words: Set<string>): Grid {
  if (detectBestWord(grid, words) !== null) return grid;

  const wordArr = Array.from(words);
  const word = wordArr[Math.floor(Math.random() * wordArr.length)];
  const isRow = Math.random() < 0.5;
  const lineIdx = Math.floor(Math.random() * 4);
  const offset = word.length === 3 ? Math.floor(Math.random() * 2) : 0;

  return grid.map((row, r) =>
    row.map((cell, c) => {
      const pos = isRow ? c - offset : r - offset;
      const onLine = isRow ? r === lineIdx : c === lineIdx;
      if (onLine && pos >= 0 && pos < word.length) {
        return createCell(word[pos].toUpperCase());
      }
      return cell;
    })
  );
}
