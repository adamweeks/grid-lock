import { ClassicMode } from '../modes/ClassicMode.ts';
import { BlitzMode } from '../modes/BlitzMode.ts';
import type { IGameMode } from '../modes/IGameMode.ts';
import type { UIController } from '../ui/UIController.ts';
import type { BoardRenderer } from '../ui/BoardRenderer.ts';
import type { AnimationPlayer } from '../ui/AnimationPlayer.ts';

/**
 * GameController — wires the active game mode to the UI layer.
 * No mode-specific branches here; all behaviour is delegated to the mode.
 */
export class GameController {
  private activeMode: IGameMode | null = null;

  constructor(
    private readonly uiCtrl: UIController,
    private readonly board: BoardRenderer,
    private readonly animations: AnimationPlayer,
  ) {}

  startClassic(): void {
    this._startMode(new ClassicMode({
      showMessage:           (t, ms)   => this.uiCtrl.showMessage(t, ms),
      hideMessage:           ()        => this.uiCtrl.hideMessage(),
      syncUI:                ()        => this.syncUI(),
      updateWordDisplay:     (l, ok)   => this.uiCtrl.updateWordDisplay(l, ok),
      showScoreNotification: (t, ms)   => this.uiCtrl.showScoreNotification(t, ms),
    }));
  }

  startBlitz(): void {
    this._startMode(new BlitzMode({
      showMessage:           (t, ms)   => this.uiCtrl.showMessage(t, ms),
      hideMessage:           ()        => this.uiCtrl.hideMessage(),
      syncUI:                ()        => this.syncUI(),
      updateTimerDisplay:    (t)       => this.uiCtrl.updateTimerDisplay(t),
      showTimeAddBadge:      (s)       => this.uiCtrl.showTimeAddBadge(s),
      updateComboBadge:      (c)       => this.uiCtrl.updateComboBadge(c),
      exitTiles:             (cells)   => this.animations.exitTiles(cells),
      enterCells:            (cells)   => this.animations.enterCells(cells),
      onGameOver:            (s, w, b) => this.uiCtrl.showGameOver(s, w, b),
      updateWordDisplay:     (l, ok)   => this.uiCtrl.updateWordDisplay(l, ok),
      setHintAvailable:      (a)       => this.uiCtrl.setHintAvailable(a),
      showScoreNotification: (t, ms)   => this.uiCtrl.showScoreNotification(t, ms),
    }));
  }

  commit(): void {
    void this.activeMode?.onCommit();
  }

  clearSelection(): void {
    this.activeMode?.onClearSelection();
  }

  hint(): void {
    this.activeMode?.onHint?.();
  }

  reset(): void {
    if (this.activeMode?.config.id === 'classic') this.startClassic();
    else if (this.activeMode?.config.id === 'blitz') this.startBlitz();
  }

  teardown(): void {
    this.activeMode?.destroy();
    this.activeMode = null;
  }

  /** Pull all state from the active mode and push it to the UI. */
  syncUI(): void {
    if (!this.activeMode) return;
    this.board.render(
      this.activeMode.getGrid(),
      this.activeMode.getSelection(),
      true,
    );
    this.uiCtrl.updateScore(this.activeMode.getScore());
    this.uiCtrl.updateStat2Value(this.activeMode.getStat2Value());
  }

  private _startMode(mode: IGameMode): void {
    this.activeMode?.destroy();
    this.activeMode = mode;

    if (mode.config.id === 'classic') {
      this.uiCtrl.applyClassicModeUI();
    } else {
      this.uiCtrl.applyBlitzModeUI();
    }

    this.board.build(
      (r, c)   => this.activeMode?.onTileClick(r, c),
      (pr, pc) => this.activeMode?.onPivot(pr, pc),
    );

    mode.start();
  }
}
