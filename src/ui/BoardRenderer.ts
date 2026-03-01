import type { Grid, Coord } from '../types/Cell.ts';

type TileClickHandler = (r: number, c: number) => void;
type PivotClickHandler = (pr: number, pc: number) => void;

/**
 * BoardRenderer — owns the game board DOM.
 * `build()` is called once; `render()` is called on every state change.
 * Never mutates game state.
 */
export class BoardRenderer {
  private readonly boardEl: HTMLElement;

  constructor(containerId: string) {
    const el = document.getElementById(containerId);
    if (!el) throw new Error(`#${containerId} not found`);
    this.boardEl = el;
  }

  /** Build the 7×7 grid structure (tiles + pivot buttons). */
  build(onTileClick: TileClickHandler, onPivotClick: PivotClickHandler) {
    this.boardEl.innerHTML = '';
    this.boardEl.style.display = 'grid';
    this.boardEl.style.gridTemplateColumns = 'repeat(7, 1fr)';
    this.boardEl.style.gridTemplateRows = 'repeat(7, 1fr)';
    this.boardEl.style.gap = '0px';
    this.boardEl.style.width = '100%';
    this.boardEl.style.aspectRatio = '1 / 1';

    for (let gr = 0; gr < 7; gr++) {
      for (let gc = 0; gc < 7; gc++) {
        const isTileRow = gr % 2 === 0;
        const isTileCol = gc % 2 === 0;

        if (isTileRow && isTileCol) {
          const r = gr / 2, c = gc / 2;
          const el = document.createElement('div');
          el.id = `tile-${r}-${c}`;
          el.className = 'tile flex items-center justify-center rounded-lg m-1 font-black select-none';
          el.style.fontSize = 'clamp(1rem, 5vw, 1.75rem)';
          el.addEventListener('click', () => onTileClick(r, c));
          this.boardEl.appendChild(el);

        } else if (!isTileRow && !isTileCol) {
          const pr = (gr - 1) / 2, pc = (gc - 1) / 2;
          const wrapper = document.createElement('div');
          wrapper.className = 'flex items-center justify-center';
          const btn = document.createElement('button');
          btn.className = 'pivot-btn';
          btn.innerHTML = '↻';
          btn.dataset.pivotR = String(pr);
          btn.dataset.pivotC = String(pc);
          btn.addEventListener('click', () => onPivotClick(pr, pc));
          wrapper.appendChild(btn);
          this.boardEl.appendChild(wrapper);

        } else {
          this.boardEl.appendChild(document.createElement('div'));
        }
      }
    }
  }

  /** Update tile visuals to reflect current game state. */
  render(grid: Grid, selection: Coord[], isClassicMode: boolean) {
    for (let r = 0; r < 4; r++) {
      for (let c = 0; c < 4; c++) {
        const tile = grid[r][c];
        const el = document.getElementById(`tile-${r}-${c}`);
        if (!el) continue;

        el.textContent = tile.letter;

        // Preserve in-progress animation classes instead of overwriting
        const animClasses = ['tile-spinning', 'tile-exiting', 'tile-entering'];
        const preserved = animClasses.filter(cls => el.classList.contains(cls));

        el.className = 'tile flex items-center justify-center rounded-lg m-1 font-black select-none';
        el.style.fontSize = 'clamp(1rem, 5vw, 1.75rem)';

        // Re-apply preserved animation classes
        preserved.forEach(cls => el.classList.add(cls));

        const isSelected = selection.some(s => s.r === r && s.c === c);

        if (tile.isLocked) {
          el.classList.add('tile-locked', 'text-white');
          el.style.cursor = 'default';
        } else if (tile.isPulsing) {
          // Blitz only
          el.classList.add('tile-pulse', 'text-yellow-900');
          el.style.cursor = 'pointer';
        } else if (isSelected) {
          // Classic only
          el.classList.add('tile-selected');
          el.style.cursor = 'pointer';
        } else {
          el.classList.add('bg-slate-100', 'text-slate-900');
          el.style.cursor = isClassicMode ? 'pointer' : 'default';
          el.style.removeProperty('box-shadow');
        }
      }
    }
  }
}
