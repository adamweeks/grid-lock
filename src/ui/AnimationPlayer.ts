import type { Coord } from '../types/Cell.ts';

export class AnimationPlayer {
  spinQuadrant(pr: number, pc: number) {
    [[pr, pc], [pr, pc + 1], [pr + 1, pc], [pr + 1, pc + 1]].forEach(([r, c]) => {
      const el = document.getElementById(`tile-${r}-${c}`);
      if (!el) return;
      el.classList.remove('tile-spinning');
      void el.offsetWidth;
      el.classList.add('tile-spinning');
      el.addEventListener('animationend', () => el.classList.remove('tile-spinning'), { once: true });
    });
  }

  /** Animate tiles out. Returns a Promise that resolves when all animations complete. */
  exitTiles(cells: Coord[]): Promise<void> {
    return new Promise(resolve => {
      let done = 0;
      cells.forEach(({ r, c }) => {
        const el = document.getElementById(`tile-${r}-${c}`);
        if (!el) { done++; if (done === cells.length) resolve(); return; }
        el.classList.add('tile-exiting');
        el.addEventListener('animationend', () => {
          done++;
          if (done === cells.length) resolve();
        }, { once: true });
      });
    });
  }

  /** Animate entering tiles for each column that was affected by a cascade. */
  enterColumns(affectedCols: number[]) {
    affectedCols.forEach(c => {
      for (let row = 0; row < 4; row++) {
        const el = document.getElementById(`tile-${row}-${c}`);
        if (!el) continue;
        el.classList.remove('tile-entering');
        void el.offsetWidth;
        el.classList.add('tile-entering');
        el.addEventListener('animationend', () => el.classList.remove('tile-entering'), { once: true });
      }
    });
  }
}
