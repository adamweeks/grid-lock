export const CLASSIC_WORD_SCORE = 100;   // 3-letter word
export const CLASSIC_QUAD_SCORE = 500;   // 4-letter word

export const BLITZ_WORD_TIME   = 8;    // seconds added for 3-letter word
export const BLITZ_QUAD_TIME   = 15;   // seconds added for 4-letter word

/** Points for committing a word in Classic mode. */
export function scoreWordClassic(word: string): number {
  return word.length === 4 ? CLASSIC_QUAD_SCORE : CLASSIC_WORD_SCORE;
}

/** Points for committing a word in Blitz mode (multiplied by combo). */
export function scoreWordBlitz(word: string, combo: number): number {
  const base = word.length === 4 ? CLASSIC_QUAD_SCORE : CLASSIC_WORD_SCORE;
  return base * combo;
}

/** Seconds to add to the Blitz timer for committing a word. */
export function timeBonus(word: string): number {
  return word.length === 4 ? BLITZ_QUAD_TIME : BLITZ_WORD_TIME;
}
