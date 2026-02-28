import type { Grid, Coord } from '../types/Cell.ts';
import type { WordMatch } from '../types/WordMatch.ts';

/**
 * Scans all rows and columns for the longest valid word that contains
 * no locked cells. Returns null if no word is found.
 */
export function detectBestWord(grid: Grid, wordList: Set<string>): WordMatch | null {
  let best: WordMatch | null = null;

  function tryWord(str: string, cells: Coord[]) {
    if (!wordList.has(str.toLowerCase())) return;
    if (cells.some(({ r, c }) => grid[r][c].isLocked)) return;
    if (!best || str.length > best.word.length) best = { word: str, cells };
  }

  for (let r = 0; r < 4; r++) {
    const full = grid[r].map(t => t.letter).join('');
    tryWord(full, [0, 1, 2, 3].map(c => ({ r, c })));
    for (let s = 0; s <= 1; s++)
      tryWord(full.slice(s, s + 3), [s, s + 1, s + 2].map(c => ({ r, c })));
  }
  for (let c = 0; c < 4; c++) {
    const full = [0, 1, 2, 3].map(r => grid[r][c].letter).join('');
    tryWord(full, [0, 1, 2, 3].map(r => ({ r, c })));
    for (let s = 0; s <= 1; s++)
      tryWord(full.slice(s, s + 3), [s, s + 1, s + 2].map(r => ({ r, c })));
  }

  return best;
}

/**
 * Validates a manually-selected sequence of coords against the word list.
 * Checks that the word is valid AND none of the cells are locked.
 */
export function validateSelection(
  grid: Grid,
  coords: Coord[],
  wordList: Set<string>,
): boolean {
  if (coords.length < 3) return false;
  const word = coords.map(({ r, c }) => grid[r][c].letter).join('');
  if (!wordList.has(word.toLowerCase())) return false;
  return coords.every(({ r, c }) => !grid[r][c].isLocked);
}

/**
 * Returns true if (r, c) is a valid next tile for the given selection.
 * Rules:
 *   - Tile must be unlocked and not already selected
 *   - Second tile must be adjacent (horizontal or vertical)
 *   - Third+ tiles must continue in the locked direction
 *   - Maximum 4 tiles total
 */
export function canExtendSelection(
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
