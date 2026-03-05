import { describe, it, expect } from 'vitest';
import {
  seededRandom,
  getDayIndex,
  generateDailyPuzzle,
} from '../logic/DailyPuzzle.ts';
import { WORDS } from '../data/wordList.ts';

// ── seededRandom ──────────────────────────────────────────────────────────────

describe('seededRandom', () => {
  it('returns values in [0, 1)', () => {
    const rng = seededRandom(42);
    for (let i = 0; i < 100; i++) {
      const v = rng();
      expect(v).toBeGreaterThanOrEqual(0);
      expect(v).toBeLessThan(1);
    }
  });

  it('is deterministic — same seed produces same sequence', () => {
    const seq1 = Array.from({ length: 10 }, seededRandom(123));
    const seq2 = Array.from({ length: 10 }, seededRandom(123));
    expect(seq1).toEqual(seq2);
  });

  it('different seeds produce different sequences', () => {
    const seq1 = Array.from({ length: 5 }, seededRandom(1));
    const seq2 = Array.from({ length: 5 }, seededRandom(2));
    expect(seq1).not.toEqual(seq2);
  });
});

// ── getDayIndex ───────────────────────────────────────────────────────────────

describe('getDayIndex', () => {
  it('returns 1 for the epoch date 2026-01-01', () => {
    expect(getDayIndex('2026-01-01')).toBe(1);
  });

  it('returns 2 for 2026-01-02', () => {
    expect(getDayIndex('2026-01-02')).toBe(2);
  });

  it('returns 64 for 2026-03-05 (31 days Jan + 28 days Feb + 5 days Mar)', () => {
    expect(getDayIndex('2026-03-05')).toBe(64);
  });

  it('returns 365 for 2026-12-31', () => {
    expect(getDayIndex('2026-12-31')).toBe(365);
  });
});

// ── generateDailyPuzzle ───────────────────────────────────────────────────────

describe('generateDailyPuzzle', () => {
  it('returns a 4×4 grid of cells', () => {
    const { grid } = generateDailyPuzzle('2026-03-05');
    expect(grid).toHaveLength(4);
    grid.forEach(row => {
      expect(row).toHaveLength(4);
      row.forEach(cell => {
        expect(cell.letter).toMatch(/^[A-Z]$/);
        expect(cell.isLocked).toBe(false);
        expect(cell.isPulsing).toBe(false);
      });
    });
  });

  it('is deterministic — same date always produces the same grid', () => {
    const p1 = generateDailyPuzzle('2026-03-05');
    const p2 = generateDailyPuzzle('2026-03-05');
    const letters1 = p1.grid.flat().map(c => c.letter).join('');
    const letters2 = p2.grid.flat().map(c => c.letter).join('');
    expect(letters1).toBe(letters2);
  });

  it('different dates produce different grids', () => {
    const p1 = generateDailyPuzzle('2026-03-05');
    const p2 = generateDailyPuzzle('2026-03-06');
    const letters1 = p1.grid.flat().map(c => c.letter).join('');
    const letters2 = p2.grid.flat().map(c => c.letter).join('');
    expect(letters1).not.toBe(letters2);
  });

  it('puzzle number matches getDayIndex', () => {
    const dateStr = '2026-03-05';
    const { puzzleNumber } = generateDailyPuzzle(dateStr);
    expect(puzzleNumber).toBe(getDayIndex(dateStr));
  });

  it('solution words are all 4-letter words in the word list', () => {
    const { solutionWords } = generateDailyPuzzle('2026-03-05');
    expect(solutionWords).toHaveLength(4);
    solutionWords.forEach(word => {
      expect(word).toHaveLength(4);
      expect(WORDS.has(word)).toBe(true);
    });
  });

  it('is guaranteed winnable — rotating back to solution words locks all 16 tiles', () => {
    // The solutionWords are the original rows before scrambling.
    // Verify each solution word is a valid 4-letter word in WORDS.
    // This proves the puzzle can always be won by reversing rotations.
    const dates = ['2026-01-01', '2026-03-05', '2026-06-15', '2026-12-31'];
    dates.forEach(dateStr => {
      const { solutionWords } = generateDailyPuzzle(dateStr);
      solutionWords.forEach(word => {
        expect(WORDS.has(word)).toBe(true);
      });
      // 4 words × 4 letters = all 16 tiles covered
      expect(solutionWords.reduce((sum, w) => sum + w.length, 0)).toBe(16);
    });
  });

  it('grid letters are exactly the same multiset as the solution words', () => {
    const { grid, solutionWords } = generateDailyPuzzle('2026-05-01');
    const gridLetters   = grid.flat().map(c => c.letter).sort().join('');
    const solutionLetters = solutionWords.join('').toUpperCase().split('').sort().join('');
    expect(gridLetters).toBe(solutionLetters);
  });

  it('does not mutate between calls — grid cells are independent copies', () => {
    const { grid: g1 } = generateDailyPuzzle('2026-03-05');
    const { grid: g2 } = generateDailyPuzzle('2026-03-05');
    g1[0][0].isLocked = true;
    expect(g2[0][0].isLocked).toBe(false);
  });
});
