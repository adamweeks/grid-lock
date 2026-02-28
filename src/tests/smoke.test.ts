/**
 * Phase 1 smoke tests — validate core algorithms before refactoring.
 * These tests define the expected behaviour of functions that will be
 * extracted into GridEngine, WordDetector, and Scoring in Phase 2.
 *
 * Functions are reimplemented inline here so the tests are independent
 * of main.ts. In Phase 2, the tests will import the real modules.
 */

import { describe, it, expect } from 'vitest';

// ── Helpers (will become GridEngine / WordDetector in Phase 2) ─────────────

interface Cell { letter: string; isLocked: boolean; isPulsing: boolean; }
type Grid = Cell[][];
interface Coord { r: number; c: number; }

function createCell(letter: string): Cell {
  return { letter, isLocked: false, isPulsing: false };
}

/** Rotates the 2×2 quadrant at (pr, pc) clockwise, returns a new grid. */
function pivotGrid(grid: Grid, pr: number, pc: number): Grid {
  const next: Grid = grid.map(row => row.map(cell => ({ ...cell })));
  next[pr][pc + 1]     = { ...grid[pr][pc] };
  next[pr + 1][pc + 1] = { ...grid[pr][pc + 1] };
  next[pr + 1][pc]     = { ...grid[pr + 1][pc + 1] };
  next[pr][pc]         = { ...grid[pr + 1][pc] };
  return next;
}

/** Returns the best (longest) word found in rows and columns. */
function detectBestWord(
  grid: Grid,
  wordList: Set<string>,
): { word: string; cells: Coord[] } | null {
  let best: { word: string; cells: Coord[] } | null = null;

  function tryWord(str: string, cells: Coord[]) {
    if (!wordList.has(str.toLowerCase())) return;
    if (cells.some(({ r, c }) => grid[r][c].isLocked)) return;
    if (!best || str.length > best.word.length) best = { word: str, cells };
  }

  for (let r = 0; r < 4; r++) {
    const full = grid[r].map(t => t.letter).join('');
    tryWord(full, [0,1,2,3].map(c => ({ r, c })));
    for (let s = 0; s <= 1; s++)
      tryWord(full.slice(s, s + 3), [s, s+1, s+2].map(c => ({ r, c })));
  }
  for (let c = 0; c < 4; c++) {
    const full = [0,1,2,3].map(r => grid[r][c].letter).join('');
    tryWord(full, [0,1,2,3].map(r => ({ r, c })));
    for (let s = 0; s <= 1; s++)
      tryWord(full.slice(s, s + 3), [s, s+1, s+2].map(r => ({ r, c })));
  }

  return best;
}

/** Returns true if (r, c) is a valid next tile for the given selection. */
function canExtendSelection(
  grid: Grid,
  selection: Coord[],
  r: number,
  c: number,
): boolean {
  if (grid[r][c].isLocked) return false;
  const n = selection.length;
  if (n >= 4) return false;
  if (selection.some(s => s.r === r && s.c === c)) return false;
  if (n === 0) return true;

  const last = selection[n - 1];
  if (n === 1) {
    return (r === last.r && Math.abs(c - last.c) === 1) ||
           (c === last.c && Math.abs(r - last.r) === 1);
  }
  const dr = selection[1].r - selection[0].r;
  const dc = selection[1].c - selection[0].c;
  return r === last.r + dr && c === last.c + dc;
}

// ── Tests ──────────────────────────────────────────────────────────────────────

describe('pivotGrid', () => {
  it('rotates the top-left 2×2 quadrant clockwise', () => {
    const grid: Grid = [
      [createCell('A'), createCell('B'), createCell('X'), createCell('X')],
      [createCell('C'), createCell('D'), createCell('X'), createCell('X')],
      [createCell('X'), createCell('X'), createCell('X'), createCell('X')],
      [createCell('X'), createCell('X'), createCell('X'), createCell('X')],
    ];

    //  A B      C A
    //  C D  →   D B
    const next = pivotGrid(grid, 0, 0);
    expect(next[0][0].letter).toBe('C');
    expect(next[0][1].letter).toBe('A');
    expect(next[1][0].letter).toBe('D');
    expect(next[1][1].letter).toBe('B');

    // Cells outside the quadrant are untouched
    expect(next[0][2].letter).toBe('X');
    expect(next[2][0].letter).toBe('X');
  });

  it('is reversible after four pivots (full rotation)', () => {
    const grid: Grid = [
      [createCell('S'), createCell('T'), createCell('X'), createCell('X')],
      [createCell('E'), createCell('C'), createCell('X'), createCell('X')],
      [createCell('X'), createCell('X'), createCell('X'), createCell('X')],
      [createCell('X'), createCell('X'), createCell('X'), createCell('X')],
    ];

    let g = grid;
    for (let i = 0; i < 4; i++) g = pivotGrid(g, 0, 0);

    expect(g[0][0].letter).toBe('S');
    expect(g[0][1].letter).toBe('T');
    expect(g[1][0].letter).toBe('E');
    expect(g[1][1].letter).toBe('C');
  });
});

describe('detectBestWord', () => {
  const WORDS = new Set(['star', 'tar', 'rats', 'slap', 'lap']);

  it('finds STAR in the first row of the classic starting layout', () => {
    const grid: Grid = [
      ['S','T','A','R'].map(createCell),
      ['E','C','E','A'].map(createCell),
      ['R','A','K','T'].map(createCell),
      ['S','L','A','P'].map(createCell),
    ];

    const result = detectBestWord(grid, WORDS);
    expect(result).not.toBeNull();
    expect(result!.word.toLowerCase()).toBe('star');
    expect(result!.cells).toHaveLength(4);
  });

  it('returns null when no valid word exists', () => {
    const grid: Grid = [
      ['Q','Q','Q','Q'].map(createCell),
      ['Q','Q','Q','Q'].map(createCell),
      ['Q','Q','Q','Q'].map(createCell),
      ['Q','Q','Q','Q'].map(createCell),
    ];
    expect(detectBestWord(grid, WORDS)).toBeNull();
  });

  it('skips cells that are locked', () => {
    const grid: Grid = [
      ['S','T','A','R'].map(createCell),
      ['E','C','E','A'].map(createCell),
      ['R','A','K','T'].map(createCell),
      ['S','L','A','P'].map(createCell),
    ];
    grid[0][0].isLocked = true; // lock the 'S' in STAR

    const result = detectBestWord(grid, WORDS);
    // STAR is unavailable; TAR (cols 1-3) or others may still match
    if (result) {
      expect(result.word.toLowerCase()).not.toBe('star');
    }
  });
});

describe('canExtendSelection', () => {
  const grid: Grid = Array.from({ length: 4 }, () =>
    Array.from({ length: 4 }, () => createCell('X'))
  );

  it('allows any unlocked tile as the first selection', () => {
    expect(canExtendSelection(grid, [], 0, 0)).toBe(true);
    expect(canExtendSelection(grid, [], 3, 3)).toBe(true);
  });

  it('requires the second tile to be adjacent', () => {
    const sel: Coord[] = [{ r: 1, c: 1 }];
    expect(canExtendSelection(grid, sel, 1, 2)).toBe(true);  // right
    expect(canExtendSelection(grid, sel, 2, 1)).toBe(true);  // down
    expect(canExtendSelection(grid, sel, 0, 0)).toBe(false); // diagonal — invalid
    expect(canExtendSelection(grid, sel, 3, 3)).toBe(false); // far away — invalid
  });

  it('locks direction after the second tile', () => {
    // Selection going right: (0,0) → (0,1)
    const sel: Coord[] = [{ r: 0, c: 0 }, { r: 0, c: 1 }];
    expect(canExtendSelection(grid, sel, 0, 2)).toBe(true);  // continues right
    expect(canExtendSelection(grid, sel, 1, 1)).toBe(false); // turns down — invalid
  });

  it('rejects adding a tile beyond 4', () => {
    const sel: Coord[] = [
      { r: 0, c: 0 }, { r: 0, c: 1 }, { r: 0, c: 2 }, { r: 0, c: 3 },
    ];
    expect(canExtendSelection(grid, sel, 0, 3)).toBe(false); // already 4 tiles
  });

  it('rejects a tile that is already selected', () => {
    const sel: Coord[] = [{ r: 0, c: 0 }];
    expect(canExtendSelection(grid, sel, 0, 0)).toBe(false);
  });

  it('rejects locked tiles', () => {
    const lockedGrid: Grid = grid.map(row => row.map(c => ({ ...c })));
    lockedGrid[0][1].isLocked = true;
    const sel: Coord[] = [{ r: 0, c: 0 }];
    expect(canExtendSelection(lockedGrid, sel, 0, 1)).toBe(false);
  });
});
