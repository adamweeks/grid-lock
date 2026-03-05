/**
 * DailyPuzzle — generates a deterministic, guaranteed-winnable daily grid.
 *
 * Strategy: pick four 4-letter words (seeded by day index), place them as rows,
 * then apply seeded pivot rotations to scramble. The puzzle is always solvable
 * because the player can rotate back to the original four-word arrangement.
 */

import type { Grid } from '../types/Cell.ts';
import { createCell, pivotGrid } from './GridEngine.ts';
import { WORDS } from '../data/wordList.ts';

export interface DailyPuzzleData {
  dateStr: string;
  puzzleNumber: number;
  grid: Grid;
  /** The unscrambled solution rows — used only for testing / hint generation. */
  solutionWords: string[];
}

export interface DailyResult {
  date: string;
  puzzleNumber: number;
  score: number;
  wordsFound: number;
  spins: number;
}

const STORAGE_KEY = 'grid-lock-daily-v1';

// ── Seeded PRNG (LCG) ─────────────────────────────────────────────────────────

/**
 * Returns a seeded random function in [0, 1).
 * Uses a simple 32-bit LCG — good enough for puzzle generation.
 */
export function seededRandom(seed: number): () => number {
  let state = seed >>> 0;
  return () => {
    state = (Math.imul(state, 1664525) + 1013904223) >>> 0;
    return state / 0x100000000;
  };
}

// ── Day index ─────────────────────────────────────────────────────────────────

/**
 * Returns the 1-based puzzle number for a given date string (YYYY-MM-DD).
 * Puzzle #1 = 2026-01-01.
 */
export function getDayIndex(dateStr: string): number {
  const epoch = Date.UTC(2026, 0, 1);
  const [y, m, d] = dateStr.split('-').map(Number);
  const date = Date.UTC(y, m - 1, d);
  return Math.floor((date - epoch) / 86_400_000) + 1;
}

/** Returns today's date string in YYYY-MM-DD format. */
export function todayDateStr(): string {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, '0');
  const d = String(now.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

// ── Puzzle generation ─────────────────────────────────────────────────────────

/**
 * Picks `count` unique indices from [0, len) using the seeded rng.
 */
function pickIndices(len: number, count: number, rng: () => number): number[] {
  const result: number[] = [];
  const used = new Set<number>();
  while (result.length < count) {
    const idx = Math.floor(rng() * len);
    if (!used.has(idx)) {
      used.add(idx);
      result.push(idx);
    }
  }
  return result;
}

/**
 * Generates the daily puzzle grid for the given date string.
 *
 * The grid is guaranteed winnable: start with four valid 4-letter words as rows,
 * apply seeded pivot rotations. The player can always rotate back to the word
 * arrangement (or find other valid words in the scrambled state).
 */
export function generateDailyPuzzle(dateStr: string): DailyPuzzleData {
  const puzzleNumber = getDayIndex(dateStr);
  const rng = seededRandom(puzzleNumber);

  // All 4-letter words sorted for determinism (Set iteration order is insertion order,
  // which is consistent within a runtime but we sort to be safe)
  const fourLetterWords = Array.from(WORDS)
    .filter(w => w.length === 4)
    .sort();

  // Pick 4 unique words
  const indices = pickIndices(fourLetterWords.length, 4, rng);
  const solutionWords = indices.map(i => fourLetterWords[i]);

  // Build initial grid with words as rows (uppercase letters, no locked/pulsing)
  let grid: Grid = solutionWords.map(word =>
    word.split('').map(letter => createCell(letter.toUpperCase()))
  );

  // Apply 6–10 seeded pivot rotations to scramble
  const numRotations = 6 + Math.floor(rng() * 5);
  for (let i = 0; i < numRotations; i++) {
    const pr = Math.floor(rng() * 3);
    const pc = Math.floor(rng() * 3);
    grid = pivotGrid(grid, pr, pc);
  }

  return { dateStr, puzzleNumber, grid, solutionWords };
}

/** Returns today's daily puzzle. */
export function getTodaysPuzzle(): DailyPuzzleData {
  return generateDailyPuzzle(todayDateStr());
}

// ── localStorage persistence ──────────────────────────────────────────────────

export function saveDailyResult(result: DailyResult): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(result));
  } catch {
    // Ignore storage errors (private browsing, quota exceeded, etc.)
  }
}

export function loadDailyResult(dateStr: string): DailyResult | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const result = JSON.parse(raw) as DailyResult;
    return result.date === dateStr ? result : null;
  } catch {
    return null;
  }
}
