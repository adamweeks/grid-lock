/**
 * Phase 2 smoke tests — import from the extracted typed modules.
 */

import { describe, it, expect } from 'vitest';
import { createCell, pivotGrid, ensurePlayable, hasMovesRemaining } from '../logic/GridEngine.ts';
import { detectBestWord, canExtendSelection } from '../logic/WordDetector.ts';
import { scoreWordClassic, scoreWordBlitz, timeBonus } from '../logic/Scoring.ts';
import { WORDS } from '../data/wordList.ts';
import type { Grid, Coord } from '../types/Cell.ts';

// ── pivotGrid ──────────────────────────────────────────────────────────────────

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

  it('does not mutate the original grid', () => {
    const grid: Grid = [
      [createCell('A'), createCell('B'), createCell('X'), createCell('X')],
      [createCell('C'), createCell('D'), createCell('X'), createCell('X')],
      [createCell('X'), createCell('X'), createCell('X'), createCell('X')],
      [createCell('X'), createCell('X'), createCell('X'), createCell('X')],
    ];
    pivotGrid(grid, 0, 0);
    expect(grid[0][0].letter).toBe('A');
  });

  it('is reversible after four rotations', () => {
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

// ── detectBestWord ─────────────────────────────────────────────────────────────

describe('detectBestWord', () => {
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
    grid[0][0].isLocked = true; // lock the 'S' — STAR is unavailable

    const result = detectBestWord(grid, WORDS);
    if (result) {
      expect(result.word.toLowerCase()).not.toBe('star');
    }
  });
});

// ── canExtendSelection ─────────────────────────────────────────────────────────

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
    const sel: Coord[] = [{ r: 0, c: 0 }, { r: 0, c: 1 }];
    expect(canExtendSelection(grid, sel, 0, 2)).toBe(true);  // continues right
    expect(canExtendSelection(grid, sel, 1, 1)).toBe(false); // turns down — invalid
  });

  it('rejects adding a tile beyond 4', () => {
    const sel: Coord[] = [
      { r: 0, c: 0 }, { r: 0, c: 1 }, { r: 0, c: 2 }, { r: 0, c: 3 },
    ];
    expect(canExtendSelection(grid, sel, 0, 3)).toBe(false);
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

// ── Scoring ────────────────────────────────────────────────────────────────────

describe('Scoring', () => {
  it('scoreWordClassic: 3-letter = 100 pts', () => {
    expect(scoreWordClassic('ACE')).toBe(100);
  });

  it('scoreWordClassic: 4-letter = 500 pts', () => {
    expect(scoreWordClassic('STAR')).toBe(500);
  });

  it('scoreWordBlitz: applies combo multiplier', () => {
    expect(scoreWordBlitz('ACE', 1)).toBe(100);
    expect(scoreWordBlitz('ACE', 3)).toBe(300);
    expect(scoreWordBlitz('STAR', 4)).toBe(2000);
  });

  it('timeBonus: 3-letter = 8s, 4-letter = 15s', () => {
    expect(timeBonus('ACE')).toBe(8);
    expect(timeBonus('STAR')).toBe(15);
  });
});

// ── hasMovesRemaining ──────────────────────────────────────────────────────────

describe('hasMovesRemaining', () => {
  it('returns true when the current grid already contains a valid word', () => {
    const grid: Grid = [
      ['S','T','A','R'].map(createCell),
      ['Q','Q','Q','Q'].map(createCell),
      ['Q','Q','Q','Q'].map(createCell),
      ['Q','Q','Q','Q'].map(createCell),
    ];
    expect(hasMovesRemaining(grid, WORDS)).toBe(true);
  });

  it('returns false when no rotation can produce a valid word', () => {
    const grid: Grid = [
      ['Q','Q','Q','Q'].map(createCell),
      ['Q','Q','Q','Q'].map(createCell),
      ['Q','Q','Q','Q'].map(createCell),
      ['Q','Q','Q','Q'].map(createCell),
    ];
    expect(hasMovesRemaining(grid, WORDS)).toBe(false);
  });

  it('returns true when a single pivot rotation creates a valid word', () => {
    // Arrange STAR letters so no current row/column spells a word,
    // but one pivot of the top-left quadrant will place S-T-A-R in row 0.
    // After pivoting (0,0):  [A B]  →  [C A]    so we need STAR in row 0 post-pivot.
    // pivotGrid(grid, 0, 0): next[0][0]=grid[1][0], next[0][1]=grid[0][0],
    //                         next[1][1]=grid[0][1], next[1][0]=grid[1][1]
    // To get row 0 = [S, T, A, R] after pivot:
    //   next[0][0]=S → grid[1][0]='S'
    //   next[0][1]=T → grid[0][0]='T'
    //   grid[0][2]='A', grid[0][3]='R' unchanged
    const grid: Grid = [
      ['T','Q','A','R'].map(createCell),
      ['S','Q','Q','Q'].map(createCell),
      ['Q','Q','Q','Q'].map(createCell),
      ['Q','Q','Q','Q'].map(createCell),
    ];
    // Current grid: no valid word (TQAR, SQqq, etc.)
    expect(detectBestWord(grid, WORDS)).toBeNull();
    // After pivoting (0,0): row 0 = [S, T, A, R] = "STAR"
    expect(hasMovesRemaining(grid, WORDS)).toBe(true);
  });
});

// ── ensurePlayable ─────────────────────────────────────────────────────────────

describe('ensurePlayable', () => {
  const allQ: Grid = Array.from({ length: 4 }, () =>
    Array.from({ length: 4 }, () => createCell('Q'))
  );

  it('returns a grid with a detectable word when given an unplayable grid', () => {
    const result = ensurePlayable(allQ, WORDS);
    expect(detectBestWord(result, WORDS)).not.toBeNull();
  });

  it('returns the original grid unchanged when a word already exists', () => {
    const grid: Grid = [
      ['S','T','A','R'].map(createCell),
      ['Q','Q','Q','Q'].map(createCell),
      ['Q','Q','Q','Q'].map(createCell),
      ['Q','Q','Q','Q'].map(createCell),
    ];
    const result = ensurePlayable(grid, WORDS);
    expect(result).toBe(grid);
  });

  it('is idempotent — calling twice on an unplayable grid produces a playable result', () => {
    const once = ensurePlayable(allQ, WORDS);
    const twice = ensurePlayable(once, WORDS);
    expect(detectBestWord(twice, WORDS)).not.toBeNull();
  });
});
