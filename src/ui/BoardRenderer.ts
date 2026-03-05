import type { Grid, Coord } from '../types/Cell.ts';

type TileClickHandler = (r: number, c: number) => void;
type PivotClickHandler = (pr: number, pc: number) => void;

// SVG viewBox is 700×700. Each of the 7 columns/rows is 100 units.
// Tile (r,c) occupies grid cell (gr=r*2, gc=c*2); its center is:
//   cx = c * 200 + 50,  cy = r * 200 + 50
const SVG_NS = 'http://www.w3.org/2000/svg';
const tileCX = (c: number) => c * 200 + 50;
const tileCY = (r: number) => r * 200 + 50;

/**
 * BoardRenderer — owns the game board DOM.
 * `build()` is called once; `render()` is called on every state change.
 * Never mutates game state.
 */
export class BoardRenderer {
  private readonly boardEl: HTMLElement;
  private svgEl: SVGSVGElement | null = null;

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
    this.boardEl.style.position = 'relative';
    this.boardEl.style.touchAction = 'none';

    let isDragging = false;
    let lastDragCoord: { r: number; c: number } | null = null;

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
          el.style.position = 'relative';
          el.style.zIndex = '1';

          el.addEventListener('pointerdown', (e) => {
            e.preventDefault();
            el.setPointerCapture(e.pointerId);
            isDragging = true;
            lastDragCoord = { r, c };
            onTileClick(r, c);
          });

          el.addEventListener('pointermove', (e) => {
            if (!isDragging) return;
            const target = document.elementFromPoint(e.clientX, e.clientY);
            const match = target?.id.match(/^tile-(\d+)-(\d+)$/);
            if (!match) return;
            const nr = parseInt(match[1], 10);
            const nc = parseInt(match[2], 10);
            if (!lastDragCoord || nr !== lastDragCoord.r || nc !== lastDragCoord.c) {
              lastDragCoord = { r: nr, c: nc };
              onTileClick(nr, nc);
            }
          });

          const endDrag = () => { isDragging = false; lastDragCoord = null; };
          el.addEventListener('pointerup', endDrag);
          el.addEventListener('pointercancel', endDrag);

          this.boardEl.appendChild(el);

        } else if (!isTileRow && !isTileCol) {
          const pr = (gr - 1) / 2, pc = (gc - 1) / 2;
          const wrapper = document.createElement('div');
          wrapper.className = 'flex items-center justify-center';
          wrapper.style.position = 'relative';
          wrapper.style.zIndex = '1';
          const btn = document.createElement('button');
          btn.className = 'pivot-btn';
          btn.innerHTML = '↻';
          btn.dataset.pivotR = String(pr);
          btn.dataset.pivotC = String(pc);
          btn.addEventListener('click', () => onPivotClick(pr, pc));
          wrapper.appendChild(btn);
          this.boardEl.appendChild(wrapper);

        } else {
          const spacer = document.createElement('div');
          spacer.style.position = 'relative';
          spacer.style.zIndex = '1';
          this.boardEl.appendChild(spacer);
        }
      }
    }

    // SVG overlay for the selection connector — sits below all grid items (z-index 0)
    const svg = document.createElementNS(SVG_NS, 'svg') as SVGSVGElement;
    svg.setAttribute('viewBox', '0 0 700 700');
    svg.style.cssText =
      'position:absolute;inset:0;width:100%;height:100%;pointer-events:none;z-index:0;overflow:hidden';
    this.boardEl.appendChild(svg);
    this.svgEl = svg;
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
        el.style.position = 'relative';
        el.style.zIndex = '1';

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

    this._renderSelectionPath(selection);
  }

  /** Draw a rounded connector path through the centres of all selected tiles. */
  private _renderSelectionPath(selection: Coord[]): void {
    if (!this.svgEl) return;
    this.svgEl.innerHTML = '';
    if (selection.length === 0) return;

    const color = '#a5b4fc'; // indigo-300 — slightly lighter than tile-selected for contrast
    const opacity = '0.55';

    if (selection.length === 1) {
      // Single dot at the tile centre
      this.svgEl.innerHTML =
        `<circle cx="${tileCX(selection[0].c)}" cy="${tileCY(selection[0].r)}" r="20" fill="${color}" opacity="${opacity}"/>`;
      return;
    }

    // Polyline with round caps/joins — endpoints naturally form circles matching the dot radius
    const pts = selection.map(s => `${tileCX(s.c)},${tileCY(s.r)}`).join(' ');
    this.svgEl.innerHTML =
      `<polyline points="${pts}" stroke="${color}" stroke-width="40" stroke-linecap="round" stroke-linejoin="round" fill="none" opacity="${opacity}"/>`;
  }
}
